import gsap from 'gsap'

// Each function is called inside a gsap.context() scoped to the mob's <svg>.
// Selectors are automatically scoped — no need to reference the SVG element directly.
type AnimFn = () => void

export const MOB_ANIMATIONS: Record<string, AnimFn> = {

  procrastination_mob: () => {
    // Whole swarm drifts up and down
    gsap.to('[data-anim="mob-root"]', {
      y: -7, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Each blob rotates independently, staggered — gives a chaotic swarm feel
    gsap.to('[data-anim="blob"]', {
      rotation: 10, svgOrigin: '0 0',
      duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.28, from: 'random' },
    })
  },

  hater: () => {
    // Ranting body rocks left-right
    gsap.to('[data-anim="body"]', {
      rotation: 5, svgOrigin: '0 12',
      duration: 0.38, ease: 'power1.inOut', yoyo: true, repeat: -1,
    })
    // Head bobs emphatic agreement with the rant
    gsap.to('[data-anim="head"]', {
      y: -5, duration: 0.32, ease: 'power2.inOut', yoyo: true, repeat: -1,
    })
  },

  blank_page_omen: () => {
    // Slow ghostly float
    gsap.to('[data-anim="mob-root"]', {
      y: -12, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Eerie opacity shimmer
    gsap.to('[data-anim="mob-root"]', {
      opacity: 0.55, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1,
    })
  },

  burnout_shade: () => {
    // Tired, sluggish float
    gsap.to('[data-anim="mob-root"]', {
      y: -6, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Slow sideways drift — like someone swaying from exhaustion
    gsap.to('[data-anim="mob-root"]', {
      x: 5, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2,
    })
  },

  comparison_engine: () => {
    // Outer orbit dots spin continuously
    gsap.to('[data-anim="orbit"]', {
      rotation: 360, svgOrigin: '0 -20',
      duration: 9, ease: 'none', repeat: -1,
    })
    // Inner hub pulses — like a heartbeat counter-clockwise
    gsap.to('[data-anim="inner"]', {
      rotation: -360, svgOrigin: '0 -20',
      duration: 14, ease: 'none', repeat: -1,
    })
    // Core glow breathes
    gsap.to('[data-anim="core"]', {
      scale: 1.15, svgOrigin: '0 -20',
      duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
  },

  fear_phantom: () => {
    // Ethereal float
    gsap.to('[data-anim="mob-root"]', {
      y: -10, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Eye glow pulses (each eye independently)
    gsap.to('[data-anim="eye-glow"]', {
      opacity: 0.2, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.45, from: 'random' },
    })
    // Tentacles sway with a wave-like stagger
    gsap.to('[data-anim="tentacles"] > *', {
      x: 7, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.22, from: 'edges', yoyo: true },
    })
  },

  perfectionism_knight: () => {
    // Slow, imperious weight shift
    gsap.to('[data-anim="mob-root"]', {
      x: -3, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Chest breathing — very subtle
    gsap.to('[data-anim="chest"]', {
      scaleY: 1.025, svgOrigin: '0 -40',
      duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Sword glint
    gsap.to('[data-anim="sword"]', {
      opacity: 0.55, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.6,
    })
  },

  notification_swarm: () => {
    // Whole swarm bobs nervously
    gsap.to('[data-anim="mob-root"]', {
      y: -10, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Each bubble jitters independently — chaotic attention-seeking
    gsap.to('[data-anim="bubble"]', {
      y: -8, rotation: 10, svgOrigin: '0 0',
      duration: 0.42, ease: 'power1.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.08, from: 'random' },
    })
    // Trailing dots flash on and off
    gsap.to('[data-anim="dot"]', {
      opacity: 0.05, scale: 0.5, transformOrigin: '50% 50%',
      duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.12, from: 'random' },
    })
  },

  impostor_shade: () => {
    // Uncertain body sway
    gsap.to('[data-anim="mob-root"]', {
      x: -5, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Mask flickers — identity destabilising
    gsap.to('[data-anim="mask"]', {
      opacity: 0.2, scaleX: 1.06, svgOrigin: '0 -62',
      duration: 1.3, ease: 'power2.inOut', yoyo: true, repeat: -1, repeatDelay: 0.9,
    })
    // Real eyes pulse — visible when mask fades
    gsap.to('[data-anim="real-eyes"]', {
      opacity: 0.25, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.35, from: 'random' },
    })
  },

  algorithm_specter: () => {
    // Outer ring orbits continuously
    gsap.to('[data-anim="ring-outer"]', {
      rotation: 360, svgOrigin: '0 -20',
      duration: 7, ease: 'none', repeat: -1,
    })
    // Data bars slide up then reset — scrolling feed effect
    gsap.to('[data-anim="data-inner"]', {
      y: -8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Core pulses
    gsap.to('[data-anim="core"]', {
      scale: 1.35, svgOrigin: '0 -20',
      duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
  },

  deadline_wraith: () => {
    // Slow ghostly float
    gsap.to('[data-anim="mob-root"]', {
      y: -10, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Clock face pulses — time is running out
    gsap.to('[data-anim="clock"]', {
      scale: 1.06, svgOrigin: '0 -30',
      duration: 2, ease: 'power1.inOut', yoyo: true, repeat: -1,
    })
    // Eyes glow and fade alternately
    gsap.to('[data-anim="eye"]', {
      opacity: 0.12, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: 0.7,
    })
  },

  overload_colossus: () => {
    // Heavy teetering sway — too much weight to stand still
    gsap.to('[data-anim="mob-root"]', {
      x: -5, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Main screen flickers — data overload
    gsap.to('[data-anim="main-screen"]', {
      opacity: 0.45, duration: 0.9, ease: 'power1.inOut', yoyo: true, repeat: -1, repeatDelay: 0.3,
    })
    // Eyes blink staggered like a wall of monitors turning on/off
    gsap.to('[data-anim="eye"]', {
      opacity: 0.3, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.45, from: 'center' },
    })
    // Overflow papers flutter
    gsap.to('[data-anim="paper"]', {
      y: 6, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.28, from: 'random' },
    })
  },

  distraction_weaver: () => {
    // Body pulses — predatory patience
    gsap.to('[data-anim="mob-root"]', {
      y: -7, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Legs twitch like weaving/spinning
    gsap.to('[data-anim="leg"]', {
      rotation: 7, transformOrigin: '50% 50%',
      duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.22, from: 'edges' },
    })
    // Compound eyes blink erratically
    gsap.to('[data-anim="eye"]', {
      opacity: 0.1, duration: 0.6, ease: 'power2.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.14, from: 'random' },
    })
    // Notification dots on web flash
    gsap.to('[data-anim="notif-dot"]', {
      opacity: 0.15, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.19, from: 'random' },
    })
  },

  // ── New mobs ────────────────────────────────────────────────────────────────

  sluchowiec: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -8, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="eye-glow"]', {
      opacity: 0.2, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: 0.6,
    })
  },

  wzrokowiec: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -6, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="main-eye"]', {
      scale: 1.08, svgOrigin: '0 -10',
      duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="eye-small"]', {
      opacity: 0.3, duration: 0.7, ease: 'power2.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.2, from: 'random' },
    })
  },

  czytacz: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -8, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="page"]', {
      rotation: 3, svgOrigin: '-38 30',
      duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
  },

  brainless: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -5, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="mob-root"]', {
      x: 4, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2,
    })
  },

  zmeczony: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -5, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="mob-root"]', {
      x: 3, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5,
    })
  },

  glupi: () => {
    gsap.to('[data-anim="mob-root"]', {
      rotation: 5, svgOrigin: '0 0',
      duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="mob-root"]', {
      y: -6, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.7,
    })
  },

  architekt_sciany_tekstu: () => {
    gsap.to('[data-anim="mob-root"]', {
      scaleY: 1.02, svgOrigin: '0 60',
      duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="eye"]', {
      opacity: 0.3, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: 0.5,
    })
  },

  baron_pivot: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -6, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="arrow-l"]', {
      rotation: -25, svgOrigin: '-14 -20',
      duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="arrow-r"]', {
      rotation: 25, svgOrigin: '14 -15',
      duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.3,
    })
  },

  pobudzony: () => {
    gsap.to('[data-anim="mob-root"]', {
      x: 4, duration: 0.25, ease: 'power1.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="mob-root"]', {
      y: -4, duration: 0.3, ease: 'power1.inOut', yoyo: true, repeat: -1, delay: 0.08,
    })
    gsap.to('[data-anim="ray"]', {
      opacity: 0.15, duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.05, from: 'random' },
    })
    gsap.to('[data-anim="eye"]', {
      scale: 1.2, svgOrigin: '0 -26',
      duration: 0.2, ease: 'power2.inOut', yoyo: true, repeat: -1,
    })
  },

  sfrustrowany: () => {
    gsap.to('[data-anim="mob-root"]', {
      x: -3, duration: 0.5, ease: 'power1.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="crack"]', {
      opacity: 0.4, duration: 1.2, ease: 'power2.inOut', yoyo: true, repeat: -1, repeatDelay: 0.5,
    })
    gsap.to('[data-anim="steam"]', {
      y: -14, opacity: 0.1, duration: 1.5, ease: 'power1.out', yoyo: true, repeat: -1,
      stagger: { each: 0.4, from: 'random' },
    })
  },

  kolekcjoner_kursow: () => {
    gsap.to('[data-anim="mob-root"]', {
      rotation: 3, svgOrigin: '0 20',
      duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim^="book-"]', {
      x: 5, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.2, from: 'end', yoyo: true },
    })
  },

  formatowy_purysta: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -4, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="ruler-arm"]', {
      rotation: 8, svgOrigin: '18 -55',
      duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
  },

  algorytmiczny_zombie: () => {
    gsap.to('[data-anim="mob-root"]', {
      x: -5, duration: 0.8, ease: 'power1.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="mob-root"]', {
      y: -4, duration: 1.1, ease: 'power1.inOut', yoyo: true, repeat: -1, delay: 0.2,
    })
    gsap.to('[data-anim="eye-node"]', {
      opacity: 0.2, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.3, from: 'random' },
    })
  },

  intelektualista: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -9, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="finger"]', {
      rotation: 12, svgOrigin: '8 -42',
      duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
  },

  fabryka_wyswietlen: () => {
    gsap.to('[data-anim="mob-root"]', {
      y: -5, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="eye"]', {
      scale: 1.08, svgOrigin: '0 -95',
      duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    gsap.to('[data-anim="smoke"]', {
      y: -18, opacity: 0.04, duration: 2, ease: 'power1.out', yoyo: true, repeat: -1,
      stagger: { each: 0.7, from: 'random' },
    })
  },

  void_tyrant: () => {
    // Vast slow drift — cosmic scale
    gsap.to('[data-anim="mob-root"]', {
      y: -8, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
    })
    // Starfield inside twinkles
    gsap.to('[data-anim="void-stars"] > *', {
      opacity: 0.04, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.14, from: 'random' },
    })
    // Eyes blaze then dim — alien indifference
    gsap.to('[data-anim="eyes"]', {
      opacity: 0.25, duration: 2.2, ease: 'power2.inOut', yoyo: true, repeat: -1,
    })
    // Crown tendrils ripple outward
    gsap.to('[data-anim="tendrils"] > *', {
      x: 6, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
      stagger: { each: 0.22, from: 'center' },
    })
  },
}
