# ATOMS

A holistic atom solution that does not drop the complexity onto the user, and does not require them to set up the remaining parts of the system that the solution did not provide.

# MASTER ATOMS

A master atom is the base container and comes with several too choose from based on your use case. 
- ATOM
- VERTEX
- SLAB
- MODULE
- CLOUD
- DRS
- DUPLEX
- S_CLASS
- SEND
- SPREADSHEET
- STREAM

The atom solution is not required to be used with the platform, the only difference being that not all master atoms will work unless you also install what it needs. The first four options will always be available though.

# DEFAULT ATOM

The default apth is the hot path, this is the only way to get extremely fast atoms while also letting us bolt on the complexity as we need it. The deafult master atom is the vertex, which is a mini disruptor. 

This gives an extremely hot fast pass, literally. During testing a user can actually get it to where it is running at 750 mill ops / sec. While I doubt there will be many who can get it to this point, but atleast there is the option to for the few that have the use case for it. 

The disruptor literally maxes out the v8 engine and rides it coat tails. v8's characteristics consist of a spike within the first sec, then dropping quite a bit. Once it reaches the 6 second mark it then switches over to its turbo process, at first it experiences another dip, but the climbs to max performance at 9-10 secs in. At 27 secs, might be a slightly shorter/longer time depending on the station its running on, it experiences another dip in performance. My best guess is that the core has become heat soaked because this dip was experienced on all disruptors that could push v8 this hard, it was also experienced across different test beds, and finally stations as well.

# CONTRACTS

To make it easier for us to use the solution, 2 helper factory functions that creates contracts is available for use. 


## 1. Core concept

A Message Queue Atom, or Message Queue Cell, is an independently managed communication entity identified by the existing four-channel address.

Rather than treating the four-channel address as merely a routing key passed into `send()` and `sub()` operations, the address identifies a cell that can have its own behavior, configuration, metadata, temporal characteristics, and lifecycle semantics.

The cell becomes the unit of control for communication.

Its purpose is not to replace existing send operations or reduce their number. Existing specialized operations—including streaming, duplex communication, and other upgraded send behaviors—remain useful. The cell provides a more capable architectural foundation for those operations.

The central idea: communication behavior becomes associated with an independently managed cell, rather than being scattered across individual sends and subscriptions.

## 2. Cell identity

Each cell is identified by the platform's existing four-channel address:

- `rt`: Channel 1
- `ms`: Channel 2
- `sl`: Channel 3
- `k`: Channel 4

The cell's configuration and capabilities can be associated with that identity. Different cells can therefore have different communication contracts, even when they use the same underlying messaging infrastructure.

## 3. What a message queue atom can own

The cell could manage a collection of independently configurable capabilities.
- sending type and characteristics could be configured per cell... making it so that the call sites that sub into it... simply just sub to it and that call site acquires the characteristics based on that cells configuration
- subsequent send call sites could simply... have all of its schaffolding eliminated as the cell already exists configured, basically letting other call sites piggy back off of it to send messages out
- in terms of actual placement within the platform, one of the message queues is actually a first class citizen of the paltforms reactive aspect... making it so that the platforms reactivity and message queue have literal direct access to one another. Taking our approach to solids reactivery model, renderivity... and apply the same level of surgical ideals to sends and subs, compared to how it currently is as it feels like sends and subs has... not been forgetten about... but no one other than me is doing anything remotely exciting with it as this would add onto the current bespoke atom/cells the platform has
  - distrbuted reactive state/cells
  - signals
  - modules/comps
  - and now message queue
  - to be honest, it seriously only makes sense to also have the apps context also be an atom as well due to the roll in benenfits that comes with it
- Deadletter
- Groups
- Transforms
- Durable History
- Play by play time travel
- Middleware
- Compression
- Specialized encoding
- Specialized encryption
- Acks
  - Whether or not they are required, and the history of them in relation to this cell which also would strength things like dead letters, especially in use cases where there are multiple call sites... did every one recieve the msg that were supposed to, if not which did and which did not?
- Temporal semantics
  - Per-cell history, event retention, replay, and time travel, subject to the configured retention model.
- Schema and validation
  - The cell's message contract, payload validation, and handling of invalid messages.
- Permissions and tags
  - Cell-specific access policies and metadata governing how communication may be used.
- Subscription behavior
  - Persistent subscriptions, one-shot delivery, filtering, replay, and lifecycle rules appropriate to the cell.
- Ordering and conflict policies
  - Rules for competing events, ordering, duplicate handling, and reconciliation where required.
- Lifecycle and observability
  - Cell configuration, operational state, inspection, and relevant communication history.
- and more...

These are proposed capabilities, not a requirement that every cell implement all of them. A cell's purpose and configuration determine which features it needs.

## SHAPE

Thinking of performance, if everything were placed in toa single atom... just the configs alone for a message queue atom could become huge... a graph too wouldn't be the best shape as it would basically have to get walked each time...

The base atom, should essentially just be a bare metal atom... where it can store OTHER atom types within itself. Only issue with at is, once a lot of things get configured... it has a lot of baggage to carry around. 

it is almost as if an addressable atom mesh... would be best. DOesn't carry anything around besides addresses, which then only get read or accessed when required... if it even has an address saved to start with. Making the fast path... fast while not clipping the legs of use cases where more complicated configurations are required. For exmaple:

- bare metal cell
  - schema config address, if not null
  - time travel / snapshots address, become opt in... instead of a requiremnt, again... the time travel cell would still live else whre at its own addressable location... acessed only when required
  - tags, if any
  - transforms address, for when transforms are to be applied, if any
  - group configuration address, if any
  - encryption configs address, if any
  - durable config address, if any
  - compression configs address, if any
  - middleware address if any
  - and so on

## 4. Sends and subscriptions

The message queue atom does not eliminate specialized sending events. Instead, it gives them a common, addressable entity around which their behavior can be coordinated.

### Sending

A specialized send operation can retain its existing purpose while consulting the target cell's contract.

For example, depending on the operation and cell configuration, communication may involve:

1. Resolving the target cell.
2. Applying its authorization and schema rules.
3. Executing the appropriate delivery behavior.
4. Recording history when configured.
5. Applying relevant ordering or duplicate-handling rules.
6. Delivering messages to matching active subscribers.

A streaming operation and a duplex operation can still have different execution mechanisms and lifecycle requirements. The cell supplies their associated policy and identity; it does not make their underlying protocols identical.

### Subscriptions

The cell provides a natural place to define the intended subscription semantics.

| Subscription type | Expected behavior                                                              |
| ----------------- | ------------------------------------------------------------------------------ |
| One-shot          | Ends after its specified result or event                                       |
| Reactive state    | Receives the current value and continues receiving changes                     |
| Event stream      | Receives successive matching events                                            |
| Replay-enabled    | Replays the configured historical range, optionally continuing with new events |
| Page-scoped       | Remains active while its consuming page or call site is active                 |

The key distinction is between message delivery and subscription lifetime.

Receiving a value does not automatically terminate a persistent subscription. The subscription ends according to its contract and the lifecycle of its consumer.

Likewise, disposing a page's subscription does not inherently destroy the cell or its retained data.

## 5. Streaming and duplex communication

The cell architecture is particularly relevant to specialized communication patterns already present in the platform.

Streaming cells

Can associate stream-specific contracts, history, subscriber behavior, and lifecycle policies with a communication identity.

Duplex cells

Can define the policies and lifecycle for bidirectional exchanges without pretending they are ordinary one-way messages.

Temporally aware cells

Can retain selected events and support inspection or replay according to their configured temporal behavior.

The specialized send events still exist because their behaviors are intentionally preconfigured. The cell makes it possible to manage those behaviors with finer-grained control and richer capabilities.

## 6. Relationship to the rest of the platform

Message queue atoms would be independently implemented systems, consistent with your platform's composability philosophy.

| System                    | Relationship to the cell                                           |
| ------------------------- | ------------------------------------------------------------------ |
| Distributed reactive atom | Can use communication cells to propagate distributed-state changes |
| Reactive system           | Can react to relevant cell events and resulting state changes      |
| Global context            | Can provide access and integration with the wider platform         |
| Message queue             | Executes message delivery and queue-related operations             |
| Specialized send events   | Initiate communication according to their particular behaviors     |
| Subscription system       | Maintains relationships between cells and active consumers         |

First-class access between these systems allows them to coordinate without requiring the message queue atom to inherit its implementation from Signals, S Class, or the distributed reactive atom.

The cell remains independently portable. Platform integration is something that can be composed around it rather than an unavoidable dependency embedded inside it.

## 7. The intended result

The architectural objective is surgical control over each communication cell.

Each four-channel address can become a unit with its own identity, contract, policies, temporal behavior, and subscription semantics. This provides a coherent foundation for managing communication at a much finer level than individual send and subscribe calls.

The resulting benefits include:

- Per-cell history and time travel.
- More deliberate subscription lifecycle management.
- Cell-specific schemas, permissions, and tags.
- More precise inspection and debugging.
- Better coordination of streaming, duplex, and other specialized communication behaviors.
- Independent implementation and portability.
- A foundation for additional capabilities that would otherwise require disconnected mechanisms or awkward integrations.

The number of specialized sending events may remain unchanged. Their purpose is still to provide preconfigured behaviors.

The fundamental change is that each communication address becomes an independently managed message queue atom, giving the platform a precise unit around which to organize behavior, history, policies, and subscriptions.
