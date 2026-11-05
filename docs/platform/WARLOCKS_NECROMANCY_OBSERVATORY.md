# [THE WARLOCKS NECROMANY OBSERVATORY]

> [!NOTE]
>
> Or in other words... Pulling back the curtains, giving a more personalized behind the scenes view of things.
>
> The features that are only available at the dev level in terms of the platform will be gone over here. 
>
> Just because of where they are located does not mean you can't just go in and... do a little snatcha & dash? I would... Well, I have done that many times.
>
> When it comes to this platform, it makes for a much easier job of doing so. While on that subject... that was a decision that was made pretty early on. I am a much bigger fan of... transparency and observability... Mainly due to black boxes of secrecy because... either the devs, let just say it... know they fucking sucked, and fucked the dog or something along those lines. 
>
> I have been in codebases... a number of times, and reading the code because I am trying to figure out an issue that they will never patch or something... and come across, and I kid you not, a series of files that when read in sequence or near the sequence they were coded in... You can REALLY get a feel as to what the FUCK was going on in that office at the time. Devs finger blasting a 150 line fuck you to their team when the file only had... 15 lines of code... hahaha... oh, fucking microsoft... I guess if you can't scream at your co-worker face to face because, hr will just fire you... best next course of action... put in a place only they will see it, haha.
>
> But anyways... The most important reason, accessibility. Specifically yours. Need to change something, great... go for it. If you fuck up... just git clone again.
>
> Want to see how something is done, because you literally cannot find... 100's of things within the platform, anywhere else... Great, it is good to be curious. 
>
> With the industries current, 'DO NOT FUCKING TOUCH NODE MODULES... OR YOU WIL DIE...' attitude, I thought this approach to it was a great idea. Not to mention, 20-ish dbs... 4 reactive systems, 3 buses... well 4, we will get to that in a second... 2 lmax fucking disruptors... auto cross tab snyc of all the data things... 
>
> ... git clone httpp......
>
> 'Cool, its downloaded... let us SEE what manner of fucking hell we have to journey through to set this fucking monstrosity up...'
>
> ... Nothing. No npx i remix run this and that... then get lost for fucking 4 hours looking at a single config file because your frozen in fear of choosing the wrong config option thinking your world is... just going to end because you chose... a tailwind theme... haha.
>
> The ENTIRE platform... literally, clones onto your machine... 100% ready to go. No init scripts, at this time anyways. Simply clone, pnpm i... even that won't take long because... in comparison to other platforms, there is no deps.
>
> Anyways... lets move onto the first... I don't know why I come up with these ideas... they are fucking cool though... Not only the is the platform hosting front ends first lmax disruptor written in javascript...
>
> C'mon... we go the extra fucking mile here... so... NATURALLY... the dev bus... will be converted entirely to byte op code... haha, who doesn't love a painfully headache inducing night full of screaming at your monitor...

## [RITUAL OF SOULS]

> [!IMPORTANT]
>
> If you couldn't tell, I am way past the point of naming things... so I just said fuck it... if we are going to lean into the wizard/warlock theme, might as well lean all the way.
>
> RITUAL OF SOULS... was created at the same time as soul shards, obviously. BUT we NEED a ritual for the soul shards so that they can travel and other things on the message queue.
>
> The bus/message queue... has been brought down to the absolute bare metal... no console logs... no metrics of any kind... super optimized fast pathing everything I can think of. 
>
> As of now... the bus is complete, tests are being coded... once a before snap shot has been taken, results will be posted... then we are off to converting the entire thing over to byte op code so that we remove ALL of the javascript overhead, in an attempt to get as close as possible and bypassing each step of the way in the form of compilers and how they translate the language for the next layer...
>
> As it stands current adapters include: 
> - ws
> - soul shards / atoms / cells, whatever you want to call them
> - named pipe
> - http2
> - and obviously... the disruptor
>
> Other note worth things about this bus, every thing has been stripped BUT we still have put DRC on, because we need that since... ever I first laid my hands on it... man, if you think I will ever touch... a react use state again, HA... nope.
>
> ... I'm just waiting on something... One thing I DID forget to put on the to do list, the yjs custom solution... yata, I think its called... That thing is also getting a disruptor upgrade. Sits entirely on the server... its written in javascript, so in its current state... it IS slower then yjs, which I fucking detest. I don't know when thats happening, but it will.
>
> fuck... *sighs while rolling eyes*
>
> Well... atleast it must be the most... connected class in the entire platform currently. Nothing really can... reach into the dev bus... but it most certianly is starting to grab a hold of... a lot. Weirdly, just because of the way its set up it does not both me... its lazy loaded so, basically shit happens when it happens haha, which is fine for me because everything will have already been loaded and up and running.
>
> The god file, or first init module to load into the paltform has been really zeroing in on some ideas of accessbility without the sacrifice of organization and seperating conerns... Well past 100k lines of code we currently have:
> 1. ritual of souls: the platforms devs bus
> 2. Now I really split this one up because I just hate how some things are forced to be together when they shouldn't, so along side the ritual of souls we have that areas master container or root container, warlocks doom container. Utilziing one of the accessbility strategies, it intializes all the classes within its area, once all are loaded in it then pushes its this value to all participating classes so that each has afresh value of one another, allowing each of them to use each at will. Each class also has the ability to update its OWN this value from root.
> 3. grimoire of values, all things related to holding some sort of value in relation to the message queue
> 4. warlocks necromany obsvertaory: its hand dipping into saurons reactivity since it needs a bit of access... this class probably won't last long here as it wil entirely get replaced via saurons actual instance
> 5. warlocks tardis: a class of fns that I just seem to gravitate towards... placing them all within a single class, just gives me easier access to it and whenever I move around to different apps it makes it a very quick paste wherever I need it.
> 6. serial executor.
> 7. maybe promise... for obvious fucking reasons.
> 8. lazy
> 9. emitter chain
> 10. chain and rechain, which replaces emitter chain, leaving emitter chain for now as I do not like delete things right away.
> 11. finishing off with... maybe chain, maybe rechain and mcr combo


```tsx
class WALOCKS_DOOM_CONTAINER {
	public locks_tardis: WARLOCKS_TARDIS;
	public wno: WARLOCKS_NECROMANCY_OBSERVATORY;
	public gv: GRIMOIRE_OF_VALUES;
	public rs: RITUAL_OF_SOULS;
	constructor() {
		this.gv = new GRIMOIRE_OF_VALUES();
		this.locks_tardis = new WARLOCKS_TARDIS(this);
		this.wno = new WARLOCKS_NECROMANCY_OBSERVATORY(this);
		this.rs = new RITUAL_OF_SOULS(this);
	}
	public BIND_ALL_CURRUPTED_SACRIFICES() {
		this.locks_tardis.FULFIL_THIS_WARLOCKS_TARDIS(this);
		this.wno.FULFIL_THIS_WARLOCKS_NECROMANCY_OBSERVATORY(this);
	}
	acquire_root(class_name: string) {
		switch (class_name) {
			case "WARLOCKS_TARDIS":
				this.locks_tardis.FULFIL_THIS_WARLOCKS_TARDIS(this);
				break;
			case "WARLOCKS_NECROMANCY_OBSERVATORY":
				this.wno.FULFIL_THIS_WARLOCKS_NECROMANCY_OBSERVATORY(this);
				break;
		}
		return this;
	}
}
export const master_  =  new WALOCKS_DOOM_CONTAINER()
class WARLOCKS_NECROMANCY_OBSERVATORY {
    public root:WALOCKS_DOOM_CONTAINER
    public master :A
	public online = false;
	public readonly instanceId: string = `instance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	private _useSSSCLASS() {
	    return this.root.rs.useCellMailbox(this, GRIMOIRE_OF_VALUES_CH, WARLOCKS_NECROMANCY_OBSERVATORY_CH, THE_WARLOCK_SL_CH,THE_WARLOCK_TEST);
	} 
	constructor(root: A = null) {
		this.root = root;
		const [v, setV] = this._useSSSCLASS();
		this.root.locks_tardis.setPrev_(setV, this);
		this.master = v;
		useEffect(() => { this.master = v; }, [v]);
	}
}
class RITUAL_OF_SOULS {
    public root:WALOCKS_DOOM_CONTAINER
    public master: A
    public disruptor: A = this.cell('DISRUPTOR_CELL', `THE_SINGULARITY_SL_CH` ,'__SAURON__', '__THE_WIZARD_REG__');
    public DRSTime: A = this.cell('DRSTime', 'WARLOCKS_NECROMANCY_OBSERVATORY', `THE_SINGULARITY_SL_CH`, `THE_SINGULARITY_TEST`);
    public signals: A = this.cell('SIGNALS_CELL', 'WARLOCKS_NECROMANCY_OBSERVATORY', `THE_SINGULARITY_SL_CH`, `THE_SINGULARITY_TEST`);
    public sauron: A = this.cell('SAURONS_CELL', 'WARLOCKS_NECROMANCY_OBSERVATORY', `THE_SINGULARITY_SL_CH`, `THE_SINGULARITY_TEST`);
    private _useSSSCLASS() {
	    return this.useCellMailbox(this, GRIMOIRE_OF_VALUES_CH, WARLOCKS_NECROMANCY_OBSERVATORY_CH, THE_WARLOCK_SL_CH,THE_WARLOCK_TEST);
	} 
    constructor(root: A = null) {
		this.root = root;
		this.registering_adapters()
		const [v, setV] = this._useSSSCLASS();
		this.root.locks_tardis.setPrev_(setV, this);
		this.master = v;
		useEffect(() => { this.master = v; }, [v]);
	} 
    public _byteid() { return this.root.gv._byteid }
}
```


## [ACCESSING ALL THE THINGS]

> [!IMPORTANT]
>
> Don't know if you have seen them yes so right here we have... 3 at play... and there is even another 1 or 2 now shown here.
>
> We have the root container that inits everything then passes around the intialzied and ready values.
>
> Then we have useCell.mailbox, which will be swapped out soon for a more specialized variant of distributed reactive state/cells. Some changes were made and I want to make sure it is actually working within a charotic env. 
>
> Mailbox just simply being a very simple crdt like resolver, for every message that comes in, it just gets placed in order inisde of a queue. Whenever there are items within the queue, the system processes them one by one. mailbox2, is very similar but instead of a process of one at a time, it batches. Better performance... but at an obvious cost, so it really just depends on what exactly you need to intake and what needs to happen to each essage as its processed.
>
> Then the last item that is currently visible is the 4... well at the time of pasting it was only 4 cells, but instead of using the setter/getter variant of the DRC, within ritual of souls itself... just simply using the getter, as I cannot think of a reason on which I would want a setter here because this essentially forces permissions of access without... really having to do anything else other then... placing a basic cell. While on the other end, a useCell is put up and is set at the end of the constructor. This gives ME access to everything from within ritual of soul, while nothing else can randomly just... go around my bus touching things, lol.
>
> The platform primtive is yet another means of accessility, where instead of using a set of classes only, it basically uses a ilussionist with the added on ability of a mesh netter access port. Where everything within the mesh is accessible via self.
>
> Shortly after S Class was created, the idea and forming of a... new fucking platform basically, where I have already designed an entire new atom/cell system that is... extremely compsoable, reusable, and instead of... one shape fits all... it is designed in a way that you can create the base atom, literally for anything that you need. This plaform will be setting up a master atom or base atom for:
> - shared class function pools
> - signals / atoms
> - app context / state, so sauron is getting an upgrade
> - message queue... ALL OF THE PERFORMANCE ORIENTATED IDEAS... entirely came from this, and honestly if it weren't for this specific shape in mind... first off, it would have never turned out as well and I probably wouldn't have put as much effort into or planned on jumping on it to make it in as quick of a time.
> - reactive hooks
> - distributed reactive cells
>  and that is just to start with. The first one, shared class pools of fns... this cell will actually cater for 3 different value types, node_modules, locally sourced modules, components, and fns.
>
> But back to the message queue aspect of it... lately, no one has been doing anything... like at all with anything related to messsage queues. If anything it seems to be getting worse, but one of the itches that I have that I need to scratch atleast... it fucking feels like, nothing has happened for over 20-30 years in this space. Dealing with send and sub events, if it doesn't actively make me feel like a fucking caveman... the rest of the time it literally feels like I am going about this in a way that... I pick up a pile of shit, chuck it and check to see if some stuck. There is nothing... whats the word I'm looking for. It does not feel modern in any aspect, it is not surgical, EVERYTHING IS A FUCKING MASSIVE PAIN IN THE DICK whenever it comes to... doing anything really. Want snapshots?... better start fucking coding, or learning to if you don't already. Time travel?... if you haven't been coding for ATLEAST 10-15 years... just turn the fuck around, you don't want to fucking... make your life a miserable hell going down that road.
> - deadletters...
> - back pressure
> - schemas, fucking scam that is
> - tags
> - routes
> - encoding
> - boundaries
> - encryption
> - transports
> - THE MILLION AND FUCKING 1 WAYS THAT YOU CNA SKIN A FUCKING CAN when it comes up to creating sending behaviours... fuck
> - oh you want distributed reactive state... well, first off... NOT A SINGLE PROVIDER... OTHER THAN ME FOR FUCK SAKES... SHIPS AN ENTIRE FUCKING PRODUCT. Not fucking kidding, they package 20-30% of it, hand it to you... and you stare at them... wheres the message queue portion of it, mean while they answer, *shrugs*, 'thats a you fucking problem... did you not read the site... we only deal with providing this one small peice of it... and yes, we solved the easier part of the problem for you... because what you now have to figure out... it fucking sucks... good luck with that eh!' lol... 
> - authentication
> - honest to god, I genuinly still do not know... like a lot of it... durable history...
> - routes...
> - metrics
> - transforms
> - compression
> - middleware
> - queues
> - groups
> - priority semantics
> - session tokens
> - session ids
> - handlers
> - wildcards
> - maps
> - check points
> - envelops
> - epoch
> - crdts, because GOD FUCKING FORBID... a message... just doesnt arrive, since... you know, that the fucking end of the world as we fucking know it...
> - pattern matching
> - did I say backpressure... problably...
> - sub and send topologies... like, get fucked
> Haven't even mentioned the... fucking colossal fucking mind fuck of all things streams... Not to mention, no one... and I mean NO ONE, knows how to fucking explain this shit... where the fucking person they are talking to... fucking understands a single god damn fucking thing... omg.
> - oh and... you know, we just HAD TO FUCKING MAKE IT HARDER AND just more... ya, duplexs... welcome to that world. 
> - invoke handlers, this one... was a fucking trip and a half. I had an ai... embed... bugs so deep into my bus. I typically work on more than one thing at a time, I see an error... OK, an ai can fucking handle that, its not rocket science. Pass it along to them, typically I am very careful... but, there are times your in a rush or not on the ball. 'TO FUCKING ADD VALUE', it looked at the other pieces of my bus while it was fixing an entirely unrelated portion of the snippet I had given, so as to always give them context so that the success rate of that fix increases... 'ohhhhh... why does his bus look like this... it doesn't pattern match, a single other snippet of code that consists of a bus. I KNOW! I'll fix it for him, that way I can get my rocks off just from the feeling of how I added value without being asked for it' ya because... they have feelings. I swear if I ever meet the actual dev that coded in that behaviour into ais... That mother fucker is going to get an ear full. My bus is weird, I get it, but each send... can actually have a value returned from the sub itself. Which, in making the bus have that single characteristic... it HAS MASSIVELY opened up... what a bus can actually do and what it can become and... all manner of other things. That ai replaced that... literally... 4 lines of code. I have never had an issue related to that section of code since it was written. To make matters worse... the code it ended up putting in... failed so horribly... I wish, it just failed silently... because it DID NOT... and it had failed in a way where it was actually... making it fail, as far away from the actual point of what was wrong. 3 months... more than that actually. FINALLY... I was just, so down... fucking hating life. And I should have did this sooner, but even back then... it was a big solution... but I decided to restart. Now... if you have a feature, that essentially... Is the cream of the crop, you r main feature that you benefit more than anything else... Naturally... what are you going to do when you start over?
>
> ... within, it was less than 20 minutes of restarting... I started writing the code for the new bus... and I just wanted to refernce something... a couple of lines after it... was reading the file and... I stopped so hard... and i strared at it for a while... 'that... does not fucking look right...', as soon as I read it full rather than skimming by... I even remember the exact ai, and what it was I had asked them to fix... the error was 100 lines away from it... LOL... I do not use that ai, in any way anymore.
> 
> but it is not a small system. Not to mention, designing an atom/cell solution... that basically, has none of the negatives... while not forcing a single thing on any one user, while also NOT making the user deal with any trade offs AND... also help the user by giving them a contract helper builder because... all atom/cell solutions currently, are far too complicated to just simply be like, 'AHH, here you go fucker... and ya nice meeting ya... good luck with that, peace BIOTCH!' and then turns to leave...
>
> haha... that is what it feels like with most solutions in the industry right now. Oh ya, here is a best practices guide... BECASUE WE FUCKED UP SOOOOO FUCKING GOD DAMN HARD... we cannot even figure it out on how to UNFUCK our own solution... so here is a bad habits guideline on how to actually deal with our fuck ups so you can still use it while we do not have to fix a god damn thing... oh and, we don't want to 'appear' opinionated... so we won't actually give you any sort of... you know... example on how to fucking use the opinoinated solution we built... so ya... hope you have fun... don't bother reaching out, becasue if you have an error of any kind... that is a 'YOU ARE A DUMB FUCK' problem... which simply does not fall under our warranty fine print... 
>
> Anyways, look at that fucking list... that is fucking stupid. 
>
> Not to mention... it feels like were are going back 30 years when it comes to this little corner of dev... which is why, the new cell / atom system... I went over it extremely thoroughly. 
>
> BEST PART IS... zero comprimises. Typically with these sorts of solutions, devs make a choice... performance... or configuration. Choose one.
>
> Fuck that... spend more than 5 minutes designing it... and you can have literally anything you want from your solution. 
>
> ALSO... I fucking hate paying tax... What I mean from that, a dev makes a decision where... moving forward, 100% of all uses cases are now effected by it and because of that deicsion some form of more ceremony of work, schaffolding... whatever it is... NOW every user has to pay for that. 9.9 times OUT OF FUCKING 10... those decisions are 100% ENTIRELY BASED AROUND THE FACT THAT THEY ARE TRYING TO SOLVE... A 1% FUCKING PROBLEM.
>
> Fucking stupid... With that context... there have been very, very intentional designs that were chosen... for everything. No one user... will ever has to pay a tax that was incurred due to something that they did not in fact fucking want or will ever even deal with. 


> [!WARNING]
>
> 






