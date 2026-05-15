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
}
