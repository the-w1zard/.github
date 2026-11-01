import { createContext, useContext, useEffect, useState, useCallback, useRef } from "#sauron";
import { cn } from "~/components/midgardr";
import { useEventSource } from "./use-event-source";

export interface EventSourceOptions {
  init?: EventSourceInit;
  event?: string;
  enabled?: boolean;
}

export type EventSourceMap = Map<
  string,
  { count: number; source: EventSource }
>;

const context = createContext<EventSourceMap>(
  new Map<string, { count: number; source: EventSource }>(),
);

export const EventSourceProvider = context.Provider;

 
export interface UseStreamProps {
  intent: string;
  endpoint?: string;
  params?: Record<string, any>;
  enabled?: boolean;
}

export function useStream({
  intent,
  endpoint = "/sse/stream",
  params = {},
  enabled = true,
}: UseStreamProps) {
  const searchParams = new URLSearchParams({
    intent,
    ...Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>),
  });

  const url = `${endpoint}?${searchParams}`;
  const rawData = useEventSource(url, { enabled });
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawData) return;

    try {
      const parsed = JSON.parse(rawData);
      setData(parsed);
      setError(null);
    } catch (err) {
      setError(`Parse error: ${err}`);
    }
  }, [rawData]);

  return { data, error, loading: enabled && !data && !error };
}

export interface StreamProps extends React.HTMLAttributes<HTMLDivElement> {
  intent: string;
  endpoint?: string;
  params?: Record<string, any>;
  enabled?: boolean;
  children?: (data: { data: any; error: string | null; loading: boolean }) => React.ReactNode;
}

export function Stream({
  intent,
  endpoint,
  params,
  enabled = true,
  children,
  className,
  ...props
}: StreamProps) {
  const stream = useStream({ intent, endpoint, params, enabled });

  return (
    <div className={className} {...props}>
      {children?.(stream)}
    </div>
  );
}

export interface StreamEmitterProps {
  intent: string;
  endpoint?: string;
  onEmit?: (data: any) => void;
  onError?: (error: any) => void;
  children: (emit: (data: any, params?: Record<string, any>) => Promise<void>) => React.ReactNode;
}

export function StreamEmitter({
  intent,
  endpoint = "/api/stream/emit",
  onEmit,
  onError,
  children,
}: StreamEmitterProps) {
  const [isEmitting, setIsEmitting] = useState(false);

  const emit = useCallback(async (data: any, params: Record<string, any> = {}) => {
    setIsEmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          data,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      onEmit?.(result);
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    } finally {
      setIsEmitting(false);
    }
  }, [intent, endpoint, onEmit, onError]);

  return children(emit);
}

export interface StreamBridgeProps {
  intent: string;
  endpoint?: string;
  params?: Record<string, any>;
  enabled?: boolean;
  onData?: (data: any) => void;
  onError?: (error: any) => void;
  children: (stream: {
    data: any;
    error: string | null;
    loading: boolean;
    emit: (data: any, params?: Record<string, any>) => Promise<void>;
  }) => React.ReactNode;
}

export function StreamBridge({
  intent,
  endpoint,
  params,
  enabled = true,
  onData,
  onError,
  children,
}: StreamBridgeProps) {
  const stream = useStream({ intent, endpoint, params, enabled });

  useEffect(() => {
    if (stream.data) {
      onData?.(stream.data);
    }
    if (stream.error) {
      onError?.(stream.error);
    }
  }, [stream.data, stream.error, onData, onError]);

  return (
    <StreamEmitter intent={intent} onError={onError}>
      {(emit) => children({ ...stream, emit })}
    </StreamEmitter>
  );
}

export interface StreamManagerContextType {
  activeStreams: Set<string>;
  maxStreams: number;
  addStream: (key: string) => boolean;
  removeStream: (key: string) => void;
  canAddStream: () => boolean;
}

const StreamManagerContext = createContext<StreamManagerContextType | null>(null);

export function StreamManagerProvider({
  children,
  maxStreams = 5
}: {
  children: React.ReactNode;
  maxStreams?: number;
}) {
  const [activeStreams] = useState(new Set<string>());

  const addStream = useCallback((key: string) => {
    if (activeStreams.size >= maxStreams) {
      console.warn(`Stream limit reached (${maxStreams}). Cannot add stream: ${key}`);
      return false;
    }
    activeStreams.add(key);
    return true;
  }, [activeStreams, maxStreams]);

  const removeStream = useCallback((key: string) => {
    activeStreams.delete(key);
  }, [activeStreams]);

  const canAddStream = useCallback(() => {
    return activeStreams.size < maxStreams;
  }, [activeStreams, maxStreams]);

  return (
    <StreamManagerContext.Provider value={{
      activeStreams,
      maxStreams,
      addStream,
      removeStream,
      canAddStream
    }}>
      {children}
    </StreamManagerContext.Provider>
  );
}

export function useStreamManager() {
  const context = useContext(StreamManagerContext);
  if (!context) {
    throw new Error('useStreamManager must be used within StreamManagerProvider');
  }
  return context;
}

export function ManagedStream({
  intent,
  endpoint,
  params,
  enabled = true,
  children,
  priority = 0,
  ...props
}: StreamProps & { priority?: number }) {
  const manager = useStreamManager();
  const [canStream, setCanStream] = useState(false);
  const streamKey = `${intent}-${JSON.stringify(params)}`;

  useEffect(() => {
    if (enabled) {
      const added = manager.addStream(streamKey);
      setCanStream(added);

      return () => {
        manager.removeStream(streamKey);
      };
    } else {
      setCanStream(false);
    }
  }, [enabled, streamKey, manager]);

  return (
    <Stream
      intent={intent}
      endpoint={endpoint}
      params={params}
      enabled={canStream}
      {...props}
    >
      {children}
    </Stream>
  );
}

export function createStreamExtension(prisma: any) {
  return prisma.$extends({
    model: {
      streamEvent: {
        async emit(intent: string, data: any, params: Record<string, any> = {}) {
          const event = await prisma.streamEvent.create({
            data: {
              intent,
              data: JSON.stringify(data),
              params: JSON.stringify(params),
              createdAt: new Date(),
            }
          });

          // Trigger SSE broadcast
          await broadcastToSubscribers(intent, {
            id: event.id,
            intent,
            data,
            params,
            timestamp: event.createdAt
          });

          return event;
        },

        async subscribe(intent: string, callback: (data: any) => void) {
          // Set up database subscription/polling for this intent
          return subscribeToIntent(intent, callback);
        }
      }
    },
    query: {
      streamEvent: {
        create({ args, query }) {
          // Auto-emit on create
          return query(args).then(async (result) => {
            if (result.intent) {
              await broadcastToSubscribers(result.intent, {
                id: result.id,
                intent: result.intent,
                data: JSON.parse(result.data || '{}'),
                params: JSON.parse(result.params || '{}'),
                timestamp: result.createdAt
              });
            }
            return result;
          });
        }
      }
    }
  });
}

// Global subscribers map (in production, use Redis or similar)
const globalSubscribers = new Map();

export function broadcastToSubscribers(intent: string, data: any) {
  const subscribers = globalSubscribers.get(intent) || new Set();
  subscribers.forEach((send: any) => {
    try {
      send({
        event: "data",
        data: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to send to subscriber:', error);
      subscribers.delete(send);
    }
  });
}

export function addSubscriber(intent: string, send: any) {
  if (!globalSubscribers.has(intent)) {
    globalSubscribers.set(intent, new Set());
  }
  globalSubscribers.get(intent).add(send);

  return () => {
    const subscribers = globalSubscribers.get(intent);
    if (subscribers) {
      subscribers.delete(send);
      if (subscribers.size === 0) {
        globalSubscribers.delete(intent);
      }
    }
  };
}

export function subscribeToIntent(intent: string, callback: (data: any) => void) {
  // This would be your database subscription logic
  // For now, just a placeholder
  return () => {};
}

export function StreamDemo() {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <StreamManagerProvider maxStreams={3}>
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Complete Stream System Demo</h2>
          <p className="text-muted-foreground">
            Full bidirectional streaming with database integration and stream management
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Chat Example with bidirectional streaming */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <h3 className="font-semibold mb-4">Real-time Chat</h3>
            
            <StreamBridge
              intent="chat"
              params={{ room: "demo" }}
              onData={(data) => {
                if (data.type === 'message') {
                  setChatMessages(prev => [...prev, data.message]);
                }
              }}
            >
              {({ data, error, loading, emit }) => (
                <div className="space-y-4">
                  <div className="h-40 overflow-y-auto bg-muted rounded p-2 space-y-2">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="text-sm">
                        <strong>{msg.user}:</strong> {msg.text}
                      </div>
                    ))}
                    {loading && <div className="text-xs text-muted-foreground">Connecting...</div>}
                    {error && <div className="text-xs text-destructive">{error}</div>}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter' && newMessage.trim()) {
                          await emit({
                            type: 'message',
                            message: {
                              user: 'You',
                              text: newMessage,
                              timestamp: new Date().toISOString()
                            }
                          });
                          setNewMessage('');
                        }
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (newMessage.trim()) {
                          await emit({
                            type: 'message',
                            message: {
                              user: 'You',
                              text: newMessage,
                              timestamp: new Date().toISOString()
                            }
                          });
                          setNewMessage('');
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </StreamBridge>
          </div>

          {/* Managed Streams Example */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="font-semibold mb-2">High Priority Stream</h3>
              <ManagedStream intent="critical-alerts" priority={10}>
                {({ data, error, loading }) => (
                  <div className="text-sm">
                    {loading && "Connecting to critical alerts..."}
                    {error && <span className="text-destructive">{error}</span>}
                    {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
                  </div>
                )}
              </ManagedStream>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="font-semibold mb-2">Normal Priority Stream</h3>
              <ManagedStream intent="notifications" priority={5}>
                {({ data, error, loading }) => (
                  <div className="text-sm">
                    {loading && "Connecting to notifications..."}
                    {error && <span className="text-destructive">{error}</span>}
                    {data && (
                      <div className="bg-muted rounded p-2">
                        {data.title}: {data.message}
                      </div>
                    )}
                  </div>
                )}
              </ManagedStream>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="font-semibold mb-2">Low Priority Stream</h3>
              <ManagedStream intent="metrics" priority={1}>
                {({ data, error, loading }) => (
                  <div className="text-sm">
                    {loading && "Connecting to metrics..."}
                    {error && <span className="text-destructive">{error}</span>}
                    {data && <div>CPU: {data.cpu}%</div>}
                  </div>
                )}
              </ManagedStream>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Usage Examples</h3>
          
          <div className="bg-muted rounded-md p-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Server-side Prisma Extension:</h4>
              <pre className="text-sm bg-background rounded p-2 overflow-x-auto">
{`import { prisma } from '~/modules/libs/prisma';
import { createStreamExtension } from '~/components/stream';

const streamPrisma = createStreamExtension(prisma);

// Emit events from anywhere in your app
await streamPrisma.streamEvent.emit('chat', {
  type: 'message',
  message: { user: 'John', text: 'Hello!' }
});`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">SSE Route Handler:</h4>
              <pre className="text-sm bg-background rounded p-2 overflow-x-auto">
{`// app/routes/sse.stream.ts
import { eventStream } from "remix-utils/sse/server";
import { addSubscriber } from "~/components/stream";

export async function loader({ request }) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  return eventStream(request.signal, function setup(send) {
    const unsubscribe = addSubscriber(intent, send);
    return unsubscribe;
  });
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Emit Route Handler:</h4>
              <pre className="text-sm bg-background rounded p-2 overflow-x-auto">
{`// app/routes/api.stream.emit.ts
import { broadcastToSubscribers } from "~/components/stream";

export async function action({ request }) {
  const { intent, data, params } = await request.json();
  
  // Save to database and broadcast
  await broadcastToSubscribers(intent, { data, params });
  
  return json({ success: true });
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Stream Manager Usage:</h4>
              <pre className="text-sm bg-background rounded p-2 overflow-x-auto">
{`<StreamManagerProvider maxStreams={5}>
  <ManagedStream intent="chat" priority={10}>
    {({ data, loading, error }) => (
      <div>{data?.message}</div>
    )}
  </ManagedStream>
</StreamManagerProvider>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </StreamManagerProvider>
  );
}
