import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface TutorialStep {
  title: string;
  message: string;
  hint: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'A Divine Voicemail',
    message: [
      "Noah! It's Me. God. Yes, THE God.",
      "",
      "Don't look so surprised \u2014 I literally made you from dust. Pretty good job if I say so Myself.",
      "",
      "So here's the situation: I've been watching humanity and... wow. The wickedness, the violence, the AUDACITY. I regret to inform you I'm sending a flood. A big one. Biblical, you might say.",
      "",
      "But you, Noah? You're a righteous man. The ONLY righteous man, actually, which says a lot about the competition. So I'm giving you a heads-up and a to-do list: build a giant ark, fill it with animals, and ride out the apocalypse.",
      "",
      "Simple, right? Let's get moving.",
    ].join('\n'),
    hint: 'Use WASD to move, Shift to sprint \u2014 go explore!',
  },
  {
    title: 'Holy Lumberjacking',
    message: [
      "See those resource piles scattered around? Walk up and press E to gather them:",
      "",
      "\ud83e\udeb5 Wood \u2014 basic building material. Grab everything that isn't nailed down. Actually, grab the nails too.",
      "",
      "\u2b1b Pitch \u2014 dark, goopy blobs. For waterproofing. Trust Me on this one.",
      "",
      "\ud83c\udf56 Food \u2014 even God's chosen have got to eat. Manna from heaven isn't available yet. That's a Moses thing. Spoilers, sorry.",
      "",
      "And keep an eye out for Gopher Wood up on the hills \u2014 I specifically requested it in the blueprints. No, it has nothing to do with gophers. My naming conventions are not up for debate.",
    ].join('\n'),
    hint: 'Press E near resource piles to gather',
  },
  {
    title: 'Extreme Home Makeover: Genesis Edition',
    message: [
      "Excellent, you've got some wood! Now see that construction site to the east? That's your future ark. I've already filed the divine building permits.",
      "",
      "Head over there and:",
      "\u2022 Press B to build a section (costs 10 wood)",
      "\u2022 Press P to coat with pitch (costs 5 pitch)",
      "",
      "Thirty sections total. Yes, thirty. I don't do dinghies, Noah. This thing needs to be three hundred cubits long. I had to invent a whole new unit of measurement for this project.",
      "",
      "And DON'T skip the waterproofing \u2014 one leaky plank and your luxury ark becomes a luxury submarine. The animals are NOT good swimmers. Well, the fish are. But they weren't invited.",
    ].join('\n'),
    hint: 'Head east to the ark. B = build (10 wood), P = waterproof (5 pitch)',
  },
  {
    title: "Noah's Really Awkward Petting Zoo",
    message: [
      "First section built! Wonderful craftsmanship. Now for the fun part \u2014 animals.",
      "",
      "You need two of every kind. Seven species, fourteen animals, one very crowded boat. Walk up to an animal while you're near the ark and press F to board it.",
      "",
      "Current passenger manifest: lions, elephants, doves, horses, sheep, wolves, and bears. Yes, the predators and prey are on the SAME boat. I'm trusting you with the seating arrangement.",
      "",
      "Pro tip from the Almighty: don't put the wolves next to the sheep. And whatever you do, don't let the elephants on the top deck. I'm omniscient AND a structural engineer, and even I'm nervous about that one.",
    ].join('\n'),
    hint: 'Press F near animals (while close to the ark) to board them',
  },
  {
    title: 'About That Flood I Mentioned...',
    message: [
      "First animal aboard! Wonderful. Only thirteen to go.",
      "",
      "Now, about that water you may have noticed rising? That's not a spa feature. Every day the rain gets heavier and the flood rises faster. This is My wrath, Noah. Nothing personal. Well, it's personal for everyone ELSE.",
      "",
      "Your divine checklist:",
      "\u2610 Build all 30 ark sections",
      "\u2610 Coat them with pitch",
      "\u2610 Board 2 of each animal (14 total)",
      "\u2610 Don't drown",
      "",
      "If the elephants request a pool deck, say no. If the doves complain about turbulence, remind them they can literally fly.",
      "",
      "I'm off to prepare the rainbow \u2014 just in case you pull this off. You've got this, Noah. Probably.",
      "",
      "\u2026Mostly.",
    ].join('\n'),
    hint: 'Build the full ark, board all 14 animals, and survive the flood!',
  },
];

export function Tutorial() {
  const [step, setStep] = useState(0);
  const [showing, setShowing] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepStartRef = useRef(Date.now());
  const gameState = useGameStore((s) => s.gameState);

  // Poll game state for trigger conditions without per-frame re-renders
  useEffect(() => {
    if (skipped || showing || step >= STEPS.length) return;

    const check = () => {
      const state = useGameStore.getState();
      if (state.gameState !== 'playing') return;
      if (showTimerRef.current) return;

      const player = state.players[state.localPlayerId];
      const ark = state.arks[state.localPlayerId];
      if (!player || !ark) return;
      const [px, , pz] = player.position;
      const dist = Math.sqrt(px * px + pz * pz);
      const age = (Date.now() - stepStartRef.current) / 1000;

      let triggered = false;
      switch (step) {
        case 0:
          triggered = age > 2;
          break;
        case 1:
          triggered = dist > 5 || age > 30;
          break;
        case 2:
          triggered =
            player.inventory.wood > 0 ||
            player.inventory.gopherWood > 0 ||
            age > 60;
          break;
        case 3:
          triggered = ark.sectionsBuilt > 0 || age > 120;
          break;
        case 4:
          triggered = ark.animalsBoarded > 0 || age > 120;
          break;
      }

      if (triggered) {
        const delay = step === 0 ? 0 : 1500;
        showTimerRef.current = setTimeout(() => {
          setShowing(true);
          showTimerRef.current = null;
        }, delay);
      }
    };

    const id = setInterval(check, 500);
    check();
    return () => {
      clearInterval(id);
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, [step, showing, skipped]);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setShowing(false);
      setExiting(false);
      stepStartRef.current = Date.now();
      if (step >= STEPS.length - 1) {
        setSkipped(true);
      } else {
        setStep((prev) => prev + 1);
      }
    }, 400);
  }, [step]);

  const skipAll = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setShowing(false);
      setExiting(false);
      setSkipped(true);
    }, 400);
  }, []);

  // Don't render when hidden, skipped, or game not active
  if (!showing || skipped || step >= STEPS.length || gameState !== 'playing')
    return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes tutEnter {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes tutExit {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(30px); }
        }
        .tut-skip:hover { color: rgba(232,220,200,0.7) !important; }
        .tut-btn:hover { transform: scale(1.05); box-shadow: 0 0 15px rgba(218,165,32,0.4); }
        .tut-scroll::-webkit-scrollbar { width: 4px; }
        .tut-scroll::-webkit-scrollbar-thumb { background: rgba(218,165,32,0.3); border-radius: 2px; }
      `}</style>
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 640,
          width: '90%',
          background:
            'linear-gradient(135deg, rgba(20,15,10,0.95), rgba(35,25,15,0.95))',
          border: '2px solid rgba(218,165,32,0.6)',
          borderRadius: 12,
          padding: '20px 24px 16px',
          fontFamily: "'Georgia', serif",
          color: '#e8dcc8',
          zIndex: 1000,
          pointerEvents: 'auto',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(218,165,32,0.2)',
          animation: exiting
            ? 'tutExit 0.4s ease forwards'
            : 'tutEnter 0.5s ease forwards',
        }}
      >
        {/* Speaker badge */}
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: 20,
            background: 'linear-gradient(135deg, #DAA520, #B8860B)',
            color: '#1a0f00',
            padding: '2px 14px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 'bold',
            letterSpacing: 2,
          }}
        >
          THE ALMIGHTY
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '4px 0 12px',
            fontSize: 18,
            color: '#DAA520',
            fontWeight: 'bold',
          }}
        >
          {current.title}
        </h3>

        {/* Message body */}
        <div
          className="tut-scroll"
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            whiteSpace: 'pre-line',
            maxHeight: 250,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {current.message}
        </div>

        {/* Hint bar */}
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'rgba(218,165,32,0.15)',
            borderRadius: 6,
            fontSize: 13,
            color: '#DAA520',
            borderLeft: '3px solid #DAA520',
          }}
        >
          {current.hint}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
          }}
        >
          <button
            className="tut-skip"
            onClick={skipAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(232,220,200,0.4)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'Georgia', serif",
              padding: '4px 8px',
              transition: 'color 0.2s',
            }}
          >
            Skip Tutorial
          </button>

          <button
            className="tut-btn"
            onClick={dismiss}
            style={{
              background: 'linear-gradient(135deg, #8B6914, #DAA520)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              padding: '8px 24px',
              fontSize: 14,
              fontFamily: "'Georgia', serif",
              cursor: 'pointer',
              letterSpacing: 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            {isLast ? 'Go forth, Noah!' : 'Got it!'}
          </button>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 10,
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  i <= step ? '#DAA520' : 'rgba(232,220,200,0.2)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
