# FIRST STEPS

> Before reading the following sections, nothing you will read about here will be required. Every topic gone over, is not mandatory. 

> [!IMPORTANT] Types
>
> I've never shyed away from the fact that, this was built with a certain end user in mind. Some people will think of that as a disadvantage, while others like myself will beleive to be the exact opposite. 
>
> With saying that, I am going to have to throw you into the deep end... right off the hop. 
>
> ### Types
>
> You will see verrrryyy quickly, that types are done... drastically different here. While we will save the black magic for later on and start with the more obvious difference.


```tsx
public async send_particle(p: U, k: A, s: S, m: S, r: S, ttl?: N): P<U> {
    return await this.disruptor.send_particle(p, k, s, m, r);
}
public sub_particle(handler: CSEHandler, k: A, s: S, m: S, r: S): () => V {
    return this.disruptor.sub_particle(handler, k, s, m, r);
}
// ── READ ─────────────────────────────────────────────
public get_particle(k: A, s: S, m: S, r: S): U | UD {
    const pid = this.pidIfExists(k, s, m, r);
    if (pid < 0) return undefined;

    return this.get(pid);
}
public has_particle(k: A, s: S, m: S, r: S): B {
    return this.pidIfExists(k, s, m, r) >= 0;
}
public getMany_particle(particles: A[]): U[] {
    return particles.map((p) => this.get_particle(p.k, p.s, p.m, p.r));
}
```

> [!IMPORTANT] Types
>
> An alias system has been created and adopted platform wide. When creaing the alias I made sure that they all made sense when I basically went through the entire catalog of types that we can define.
>
> While at first, it will make you go slower... there is no going around that, but once you are used to it there is no going back. I do not see myself ever coding inside of an app without this being available. 
>
> It takes, what used to be massive defined props tables, and compresses them to a single line. The first night I was experimenting with this, I had removed north of 200,000 characters within... about 30 minutes. 
>
> Think about that though... with THAT amount of characters being removed each and every single time you have to go and type each one out, just for a single app that equates to a large amount of time wasted. 
>
> I have also found, for me anyways, I'm also able to read the code a lot faster now. Seeing the benefits come so quickly in such large amounts, you can also see that I did not limiit that compression to just types in the platform. 
>
> - p: payload
> - k: key
> - s: slave channel
> - m: master channel
> - r: root channel
> - and so on...
>
> Generics, were not forgotten about as each alias carries through whatever generics you pass on, just like it would without the system.
>

<details><summary><strong><span style="font-size: 16px; font-family: monospace">[TYPESCRIPT ALIAS MAP]</span> </strong></summary>

```tsx
type A = any
type B<T = A> = boolean
type D<T = A> = Date
type E<T = A> = Error
type F<T = A> = Function | (() => T);
type I<T = A> = Iterable<T>;
type J<T = A> = JSON
type K = keyof A
type M<K = A, V = A> = Map<K, V>;
type N<T = A> =number
type O<T = A> = Object<T>
type P<T = A> = Promise<T>;
type AW<T = A> = Awaited<T>;
type PL<T = A> = PromiseLike<T>
type R<K extends PropertyKey = A, V = A> = Record<K, V>;
type S<T = A> = string
type U<T = A> = unknown
type V<T = A> = void
type W = "*";

type ST<T = A> = Set<T>;
type MP<K = A, V = A> = Map<K, V>;

type AI<T = A> = AsyncIterable<T>
type AR<T= A> = Array<T>
type AB<T = A> = ArrayBuffer
type AG<T = A, R = A, N = A> = AsyncGenerator<T, R, N>
type AGE = AggregateError
type ABC = AbortController
type ABS = AbortSignal
type ASF<T extends (...args: A) => A> = (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>
type BI<T = A> = bigint
type BIG<T = A> = BigInt
type BL<T = A> = Blob
type BU<T = A> = Buffer
type CAP<T extends S> = Capitalize<T>
type CON<T> = ConstructorParameters<T extends abstract new (...args: A) => A ? T : never>
type CTX<T extends (...args: A) => A> = OmitThisParameter<T>
type CE<T = A> = CustomEvent
type DE<T = A> = Document
type DPR<T> = { readonly [K in keyof T]: DEEPR<T[K]> }
type DC<T = A> = Record<S, T>
type DV<T = A> = DataView
type EL<T = A> = Element
type ERR<T = A> = Error
type EV<T = A> = Event
type EQ<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type EX<T, U> = Exclude<T, U>
type EXT<T> = T extends (infer U)[] ? U : never
type F64<T = A> = Float64Array
type FR<T = A> = DocumentFragment
type FD<T = A> = FormData
type FN<T extends (...args: A) => A = (...args: A) => A> = T
type GEN<T = A, R = A, N = A> = Generator<T, R, N>
type HE<T = A> = HTMLElement
type I32<T = A> = Int32Array
type IN<T, U> = Extract<T, U>
type IT<T extends abstract new (...args: A) => A> = T extends abstract new (...args: A) => infer R ? R : A;
type IDX<T> = T extends readonly (infer U)[] ? U : never
type ITR<T = A> = IterableIterator<T>
type ITOR<T = A> = Iterator<T>
type KE<T = A> = KeyboardEvent
type KOF<T> = keyof T
type MAP<K = A, V = A> = Map<K, V>
type MUT<T> = { -readonly [K in keyof T]: T[K] }
type MAY<T> = T | null | UD
type ME<T = A> = MouseEvent
type NOI<T> = NoInfer<T>
type ND<T = A> = Node;
type NE<T = A> = never
type NLE<T = A> = NodeListOf<Element>
type NIL<T> = T | null
type NR<T> = NonNullable<T>
type NA<T = A> = NodeListOf<T>
type NU<T = A> = null
type OM<T, K extends keyof T> = Omit<T, K>
type OPT<T> = T | UD
type OB<T = A> = { [key: S]: T }
type OBJ<T = A> = { [key: S]: T }
type OV<T, U> = Omit<T, keyof U> & U
type PSR<T> = PromiseSettledResult<T>
type PFR<T> = PromiseFulfilledResult<T>
type PRR = PromiseRejectedResult
type PA<T> = Partial<T>
type PE<T = A> = PointerEvent
type PI<T, K extends keyof T> = Pick<T, K>
type REG<T = A> = RegExp
type RE<T> = Required<T>
type RM<K = A, V = A> = ReadonlyMap<K, V>
type RS<T = A> = ReadonlySet<T>
type RET<T extends (...args: A) => A> = ReturnType<T>
type RO<T> = Readonly<T>
type ROA<T extends A[]> = ReadonlyArray<T[N]>
type RT<T extends (...args: A) => A> = T extends (...args:A) => infer R ? R :A;
type SETOF<T = A> = Set<T>
type STR<T> = T extends S ? T : never
type SK<T> = keyof T & S
type SY<T = A> = symbol
type SYM<T = A> = Symbol
type TL<T extends S> = T['length']
type TUP<T extends A[] = A[]> = [...T]
type UD<T = A> = undefined
type UN<T = A> = undefined
type U16 = Uint16Array
type I8 = Int8Array
type I16 = Int16Array
type F32 = Float32Array
type U8C = Uint8ClampedArray
type U8<T = A> = Uint8Array
type U32<T = A> = Uint32Array
type U32ARB<T = A> =  Uint32Array<ArrayBufferLike>
type URI<T = A> = URL
type URLT<T = A> = URL
type VAL<T> = T[keyof T]
type WS<T extends O = O> = WeakSet<T>
type WM<K extends O = O, V = A> = WeakMap<K, V>
type WIN<T = A> = Window
type XOR<T, U> = (T | U) extends O ? (Omit<T, keyof U> & U) | (Omit<U, keyof T> & T) : T | U


type DOMX = DOMException
type WREF<T extends O> = WeakRef<T>
type FREG<T extends O> = FinalizationRegistry<T>
type DISP = Disposable
type ADISP = AsyncDisposable
type ITOBJ<T = A, R = A, N = A> = IteratorObject<T, R, N>
type AITOBJ<T = A, R = A, N = A> = AsyncIteratorObject<T, R, N>
type ERRCAUSE<T = A> = Error & { cause?: T }
type DICT<T = A> = { [key: S]: T | UD }
type ROOBJ<T> = { readonly [K in keyof T]: T[K] }
type MUTOBJ<T> = { -readonly [K in keyof T]: T[K] }
type VALOF<T> = T[keyof T]
type KEYS<T> = keyof T
type UNION<T> = T extends A ? T : never
type ISNEVER<T> = [T] extends [never] ? true : false
type ISANY<T> = 0 extends (1 & T) ? true : false
type ISUNKNOWN<T> = EQ<T, unknown>
type ISUNION<T, C = T> = T extends C ? ([C] extends [T] ? false : true) : never
type ROARR<T> = readonly T[]
type NONEMPTY<T> = readonly [T, ...T[]]
type FIRST<T extends readonly A[]> = T extends readonly [infer H, ...A[]] ? H : never
type LAST<T extends readonly A[]> = T extends readonly [...A[], infer L] ? L : never
type LENGTH<T extends readonly A[]> = T['length']
type REPLACE<S0 extends S, F extends S, T extends S> = S0 extends `${infer L}${F}${infer R}` ? `${L}${T}${R}` : S0
type SPLIT<S0 extends S, D extends S> = S0 extends `${infer L}${D}${infer R}` ? [L, ...SPLIT<R, D>] : [S0]
type JOIN<T extends readonly S[], D extends S = ''> = T extends readonly [infer H extends S, ...infer R extends S[]] ? R extends [] ? H : `${H}${D}${JOIN<R, D>}` : ''
type ARGS<T extends (...args: A) => A> = Parameters<T>
type ASYNCGEN<T = A, R = A, N = A> = AsyncGenerator<T, R, N>
type ASYNCITR<T = A> = AsyncIterableIterator<T>
type ASYNCIT<T = A> = AsyncIterable<T>
type ASSERT<T extends true> = T
type AWAIT<T> = T extends PromiseLike<infer U> ? AWAIT<U> : T
type BRAND<T, N extends S> = T & { readonly __brand: N }
type DIFF<T, U> = T extends U ? never : T
type DEEP<T> = T extends O ? { [K in keyof T]: DEEP<T[K]> } : T
type DEEPP<T> = T extends O ? { [K in keyof T]?: DEEPP<T[K]> } : T
type GUARD<T, U> = T extends U ? T : never
type INST<T> = InstanceType<T extends abstract new (...args: A) => A ? T : never>
type LOWER<T extends S> = Lowercase<T>
type PARAMS<T extends (...args: A) => A> = T extends (...args: infer P) => A ? P : never;
type PROM<T = A> = Promise<T>
type STRNUM<T = A> = `${N}`
type STRBIG<T = A> = `${bigint}`
type STRBOOL<T = A> = `${B}`
type STRKEY<T = A> = `${S & {}}`
type THIS<T extends (this: A, ...args: A) => A> = ThisParameterType<T>
type OTHIS<T> = OmitThisParameter<T>
type UNCAP<T extends S> = Uncapitalize<T>
type UPPER<T extends S> = Uppercase<T>
type WEAKMAP<K extends O = O, V = A> = WeakMap<K, V>
type WEAKSET<T extends O = O> = WeakSet<T>
```

</details>


> [!IMPORTANT] Types
>
> Each type was reviewed manually, one at a time, to ensure that no single type was missed in relation to passing in your defined generics. As you can see I have left the generics props on virtually all of them so that whenever items are added or edited, it allows me to make sure that it was in fact review and done at a previous time. Leaving it there poses no issue in the use of it.


> [!WARNING] Quadruple Tiered Scopes
>
> The next item on the weird list is that, any time you deal with any type of data... they ALL take the same format. Which is a triple tiered channel + key format. Everything from the message queue, to the databases, to the atoms/cells... everything, each having very specific and intentional benefits.
>
> Message queue: 
> - defaults the entire message queue, as multiplexed. Which in turn gives us virtually a free message queue system in terms of performance. Instead of have 100-1000 ports devoted to the solution, there is less than 10 active.
>
> Atoms/Cells/Soul Shards:
> - This allows us to organize our data, in a very nice and neat manner. The 'r' key, stands for root. By default it is set to whatever you label your app with, and there is no way of changing THAT name to something else. BUT what you can do is, if you wanted to create an entirely decoupled context/state system for something you need in your app, you simply change the r key... and voila, you just created your very own, entirely seperated context storage system from the apps context storage. 
>
> Databases:
> This one... I don't think many people will get it without an explanation but, the datbases still get the same 4 channel format when dealing with setting and getting of its values. The 'r' key, still the applications name is mapped out to be your databases name, the 'm' key is mapped either a custom label of your choosing, OR if you enabled your app to contain global and workspace enviornments, then this maps out to either or to signinfy which you are saving to. The 's' key, gives us a means to organize it by category or in this case table. Finally the 'k' key is the values key identifier. 
>
> The system works exactly the same way, everywhere. Weirdly this 4 channel setup works great in all its use cases because... When designing it, and deciding where the keys should be maped to in relation to a fn's props, to make life easier on everyone... I simply placed them backwards. 
>
> Depending on the fn it would go something like this...
```tsx
function PropsExample(payload: A, k: A = `${this.k}${this._sid()}`, s: S = this.s, m: S = this.m, r: S = this.r)
```
> [!WARNING] Quadruple Tiered Scopes
>
> And yes... each prop is accomanied with a default, even the k key when appropriate for example, when deal with signals... executing the signals function, you simply can just provide a value. Just like how you would with reacts useRef, giving you a means to a much better function to use in its place, whenever you need to reach for it.
>
> There will be times where the payload and the k key are switched, but that depends on the actual function you are dealing with. 
>
> There has been an a rolling update put into effect that is backwards compatible. Moving forward a quintuple tiered format will be put into place moving forward, where all quad tier format will slowly get upgraded.
>
> With the addition of the new atom/cell platform a new value has been put into play to signify storage type, as there are more than just a few available:
> - r: root key
> - m: master key
> - c: context storage map
> - s: slave key
> - k: key
>
> Just like previously, the new value will come with a default already put into play which in effect makes it so that if you do not need to change the storage type... you simply, don't even concern yourself with it. Just supply your key:value pair and on your way you go on to the next line of code. BUT, when you do need to change something it is as easy as suppling that extra identifier making it so that all that is required for a hot swap is:
> - key, slaveKey, contextKey
>
> The avialable storage types:
> - cache
> - sauron
> - disruptor
> - s class
> - module registry
>
> While 6th and 7th options are currently being explored where a persistent global app context system, in place of just have it stored within memory, as well as a persisted ttl encrypted option is also being evaluated.
>
> While an 8th... much more extreme option, that I will not currently go over, is also be looked at into great detail and will be given great consideration... 



> [!NOTE] Maybe Promise
>
> Before moving on there is one more 'weird' thing that is done with this platform.
>
> There is no disinctive sync / async defined functions. During the development of this platform, I was able to finally exploit a window in javascripts runtime where it now allows me to have it so that each function can be both async and sync when creating it.
>
> The async / sync functionality is actually defined at the call site with the use of await.

```tsx
type MaybePromise<R = any> = R;
function MaybePromise<R = any>(v: R): MaybePromise {
	return v !== undefined ? (v as R) : (Promise.resolve(v) as P<R>);
}
```
> [!NOTE] Maybe Promise
>
> This simple snippet of code is what allows us to achieve just that. I go into much greater detail on how and why this works, if your interested please refer to it as its simply to long to dump here.
>
> In addition to that, due to 'dropping' half of the required fns that I would need to create I decided to experiment since I had all this new api space just open up. 
>
> Maybe promise isn't the only thing that wraps a fns return value, IF you opt into it at the call site... otherwise it just simply returns the value like it would any other time.
>
> Opting into it though you would get one of two things, each of which are accessible through each call site through the use of that fns props.
>
> 1. Chain: `Chain<T>` is a fluent, state-backed value wrapper for composing operations around a value. It provides conditional branching, switch-style matching, guards, mutation, property access, side-effect taps, promise-based continuation and error handling, retries, delays, explicit throwing, and value resolution.
> 2. ReChain


> [!WARNING] [SOME OTHER NOTE WORTH ITEMS...]
>
> It would seem to a lot of people that, the removal of all friction is a bit of an obsession. It isn't, but if I can increase my productivety, thus also doing the same to my output... why wouldn't you make that investment? Especially if it does end up benefiting more than the the cost you put into it. 
>
> This industry... there is a lot of time wasting things. Like you think I want to be coding these things?... no...
>
> So the items found on this list aren't as substantial as others, still everything adds up.
>
> - twx... As of late, I have been really looking into and experiementing... being extra agressive in removing schafolding. If ceremony lives because... it is just ceremony.... that is just... fucking stupid. Yes, please give me a platform... where you devs did... almost nothing for us, the user... I would LOVE to fucking spend 2 fucking weeks configuring the app before I write a single line of code...
>
> If you do not see... THE MASSIVE fucking problem there, maybe you just need to hear... but are apart of the problem. I'm not saying it in any bad annotation, sometimes... people really do just need to hear it. We go about our lives, and get so used to things just being the way they are. So I am more telling you in a way, like man dont you want to be better?
>
> Anyways... enoguh of that... 
>
> twx: currently, it is not in a place where I would... find it to be in a place that is friendly for everyone. This is more for the dev that... your trying to cut corners... everywhere. Personally, I access the platforms values... A LOT, and it is a lot of ceremony... instead, I created a helper... it HAS been saving time, but its just not user friendly... but it only took me 2 mins to get used to it though... THAT IS HOW MUCH of a time saver it is. 
>
> ```tsx
> twx.THE_POWER_OF_TWO;
> twx.SIGNALS;
> twx.HADRON_COLLIDER;
> 
> twx.app("myKey");
> twx.app.set(myValue, "myKey");
> 
> twx.app("myKey", "slave", "master", "root");
> twx.app.set(myValue, "myKey", "slave", "master", "root");
> 
> const scope = twx("myKey", "slave", "master", "root");
> scope.get();
> scope.set(myValue);
> scope.map();
> 
> twx("myKey", "slave", "master", "root").set(myValue)
> 
> twx()
> ```
> This is what I mean in it being not user friendly. 
> twx... literally means nothing, just a unique call signature, being as short as possible. PERSONALLY... I fucking love the single letter alias... omg, you take in so much more information, in such a shorter window of time. But, the single letter annotation... is a bit extreme. Which is why its optional instead of a requirement for the platform. 
>
> Anyways... all it is, is a MUCH easier time dealing with the 4, soon to be 5 channel format the platfomr uses.
>
> This can be found in the folder, bag of tricks. Speaking of which, I would suggest you to go through it as it contains a ton of reallllyy nice smaller things. To which, I will add when I think the should be placed in there. Yesterday I placed about 30 more things in there. Actually, really nice things when dealing with byteop.
>
> There... is another category like this being made... but it won't be here, there will be a new catergory simply named dx.
>
> This folder will focus on taking things that... we use every single, all day long. For example, Map2.0 is already in there, there is something else in addition to the new map fn, but everything in here will 100% be backwards compatible. 
>
> A much BIGGER thing... will be sClass... actually, taking javascript class and upgrading it... I will submit it, but I... already know that my shit is going to be TOOO FUCKING EXTREME for these people. Meanwhile, I'll be using the shit out of it. Because, it wil be exactly like s class... but just a real class, as I have found a couple of cases where I wish it was a real class. 
>
> Don't get me wrong, I actually like the platform primitive MUCH better. When you think about it... if all you have to do is learn a single platform primitive and you now know, 105+ prims as a consequence... I can't think of a platform that... has 2 never mind the number that you can find here. Meanwhile, ALL of them do VERY different thigns.
>
> The new class will be a mesh of addressable, organizalbe classes...


> [!IMPORTANT] ACCESSING THE MESSAGE QUEUES BACKEND
>
> The platforms bus is rather unique since it is not a singular bus but rather a mesh of buses. Each of them have access to the same values so that it doesn't actually matter where you trigger a sub or a send from, it will work.
>
> In order to make access to them easier and without triggering a circular dep, there have been two classes that have been made global:
>
> - SSR: the class that sets up and initializes each of the nested map fns
> - SE: contains the shared fns that each of the buses
>
> In addition to those classes, a couple of foundational fns have also been exposed:
> - send
> - sub
> - useCell
> - useCRDT
> - useCRDTB
> - useMailbox
> - atom
> - signal
>
> The next several have also been exposed but with upgrades, they have slightly different names to ensure that they do not overwrite the originals but each of the following do not overwrite the original functionality extend them into the upgraded version while adding the upgrades to improve the dx of each.
> - array
> - date
> - error
> - iterator
> - map
> - number
> - object
> - promise
> - set
> - string
> - unit 8 array
> - url search params
> - weakmap
> - weak set













