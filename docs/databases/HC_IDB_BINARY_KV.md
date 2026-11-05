## [HADRON COLLIDER INDEXED DB BINARY KV]

> [!IMPORTANT] Give this one a FULL read before dismissing it...
>
> Because... on paper, it sounds wrong. Not to mention, no one wants this... or else it would exist already... but seriously... just hear me out because while on paper, from a technical aspect, it is not what you would want feature wise from a db... butttt... when we use dbs... its a usage thing... not a technical thing, form the point of view in terms of its technical correctness... it fucking scoes a 0... It is the usage side... that scores a clean, crisp... elegant 10. 
>
> At its core... the hadron collider is a disruptor written entirely in javascript. 116 mill+ DB passes/sec... in terms of performance, it ain't doing that bad.
>
> The hadron collider through and through... does absolutely everything, through a queue. There is no... stop, go do a direct read of this... then from there go do a direct delete of this, then go get that...
>
> In terms of actual cost per action... there is nothing wrong with that... when your slow. In relation to the collider, every other db solution would be considered slow, and all of them do this type of fn execution in terms of how it goes about procesing life. 
>
> When you get up into the levels of performance like a lmax disruptor... DOING THAT TYPE OF PROCESSING... actually is a COLLOSALLY slower process, as it is a much more expensive way of conducting how your processes get completed. 
>
> Not only does EVERYTHING go through a queue... but... we only do a single action per db pass. 
>
> While a regular db will... go about it doing 20 things in one pass, the collider does not do that at all. For exmaple, if we have 20 processes or fns we need to cover in order to satisfy the surface area of needs that a db requires... that would mean we would actually hae to do 20 entire db passes... to match the one of a regular db...
>
> But theres a catch... When we fucking hammer out... 116 mill db passes per second... we are at what... 50-60 mill passes completed... by the time, the other solution does one. I don't have the actual math in front of me, so don't quote me on it... but basically, THAT is the performance difference. 
>
> During dev... it was halarious because I kept thinking in terms of... 'oh, we have to wait for a queue, I wonder how much longer at the call site will that end up equating...' 
>
> pffft... lol, even when the binary encoder... AND... the dispatch classes have yet to be optimized, meaning in terms of the encoding part... it was slow as fuck...
>
> Round trip... If I remember correctly, .24ms... AND that is including ALLLLLLL the feature checking garbage ONTOP of that. If that is what we are starting off at... we are in goooood shape.
>
> BUT... since I have to put this db together... I AM doing one more code competition, where I have written... 6, I beleive, disruptors where each one is fundamentally different in how it is actually coded... and only the winner survives.
>
> ONCE... we have a winner, and the rest of the pieces are placed together... becasue the entire db, actually already exists, it just has to be put together... After it packaged, this collider db, as well as the platforms init bus... both of which will be converted entirely to byte op code. 
>
> In effect, if you were looking for performance... there is literally not a single db out there that could come close for your front end solution. 
>
> NOW... on to the weird part...
>
> It is going to be a dynamically dual db... where the collider will server both the server and client dbs... their hot path. 
>
> Using indexed db for the client, and binary kv for the server. 
>
> No bridge... no proxying of db fns... none of that garbage.
>
> At first thought... 'fuck... I don't want that... how the fuck am I going to access the values on the server that I had saved while triggering it in the client...'
>
> Because the api, as far as us users are concerned... it will appear to us as one db... the usage you have on the server, will be the exact same as it is in the client.
>
> Who the fuck would want this... looking at it form this angle...
>
> ... lets look at it through the ACTUAL USAGE SIDE OF THINGS... Server side... we never ACTUALLY even attempt to access client orientated values like, cache, context, state... We ONLY reach for values that can be acquired through a server side db. When your in a action or loader... you don't try to reach out for a hooks value.
>
> Thus... the same feature that turned us off at first... actually ends up giving a very elegant, crisp way of dealing with the server/client issue.
>
> In effect, the db will automatically use the correct side of itself in relation to where you had triggered the db fn.
>
> On the client and saving cache or state like values, it takes care of where its stored for you.
>
> If your on the server, it instead saves the values using the defined binary process.
>
> Both sides will have the collider as its hot path. The end result netting us an extremly fast execution path for virtually all reads, unless they fall outside of the ttl window. At which point, the first read will be slow in comparision to what they usually are, but after that first read its ttl gets reset again, placing that value back on the hot path.
> 
