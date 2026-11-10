import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Heart,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import birthdayData from './birthdayData'
import { db, storage } from './firebase'
import './App.css'

const SCHEDULE_DOCUMENT = doc(db, 'settings', 'birthday')
const PROFILE_DOCUMENT = doc(db, 'settings', 'profile')

const stars = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${(index * 61) % 100}%`,
  delay: `${(index % 7) * 0.6}s`,
  size: index % 4 === 0 ? 'large' : 'small',
}))

function FloatingStars() {
  return (
    <div className="star-field" aria-hidden="true">
      {stars.map((star, index) => (
        <span
          className={`star ${star.size}`}
          key={index}
          style={{ left: star.left, top: star.top, animationDelay: star.delay }}
        />
      ))}
    </div>
  )
}

function Button({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`button ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

function Intro({ onOpen, onAdmin }) {
  return (
    <motion.section
      className="intro-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <FloatingStars />
      <div className="intro-topline"><span className="eyebrow">A PRIVATE CELEBRATION</span><span className="topline-dot" /></div>
      <div className="intro-content">
        <div className="eyebrow">SOMETHING MAGICAL AWAITS</div>
        <h1>A little surprise<br /><em>is waiting for you.</em></h1>
        <p>Take a breath. Make a wish.<br />Then step into the celebration.</p>
        <div className="gift-scene" aria-hidden="true">
          <div className="halo halo-one" />
          <div className="halo halo-two" />
          <div className="gift-lid"><span /></div>
          <div className="gift-base"><i /><b /></div>
          <div className="gift-ribbon" />
          <div className="gift-spark spark-one">✦</div>
          <div className="gift-spark spark-two">✧</div>
        </div>
        <Button className="primary-button" onClick={onOpen}>
          Open your surprise <ArrowRight size={17} />
        </Button>
      </div>
      <div className="scroll-cue"><ChevronDown size={16} /><span>THE MOMENT STARTS HERE</span></div>
      <button className="admin-link" type="button" onClick={onAdmin}>Admin</button>
    </motion.section>
  )
}

function Confetti({ active }) {
  if (!active) return null
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 42 }, (_, index) => <i key={index} style={{ '--i': index }} />)}</div>
}

function BalloonRelease() {
  return (
    <div className="balloon-release" aria-hidden="true">
      {Array.from({ length: 20 }, (_, index) => <span className={`release-balloon release-balloon-${(index % 9) + 1} release-balloon-extra-${index}`} key={index}><i /><b /></span>)}
    </div>
  )
}

function Cake({ wished, onWish }) {
  return (
    <div className={`cake-stage ${wished ? 'is-wished' : ''}`}>
      <div className="cake-glow" />
      <div className="cake-3d">
        <div className="candle candle-one"><span className="flame" /></div>
        <div className="candle candle-two"><span className="flame" /></div>
        <div className="candle candle-three"><span className="flame" /></div>
        <div className="cake-top"><div className="icing-drip" /></div>
        <div className="cake-middle"><div className="icing-drip" /></div>
        <div className="cake-bottom"><div className="icing-drip" /></div>
        <div className="cake-plate" />
      </div>
      {!wished && <Button className="wish-button" onClick={onWish}><Sparkles size={16} /> Make a wish</Button>}
      {wished && <motion.div className="wish-complete" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>May all your wishes come true <span>✦</span></motion.div>}
    </div>
  )
}

function Constellation({ selected, onSelect }) {
  return (
    <div className="constellation-map" aria-label="Interactive constellation of wishes">
      <div className="constellation-lines" />
      {birthdayData.constellation.map((wish, index) => (
        <button
          className={`constellation-star constellation-star-${index + 1} ${selected === index ? 'selected' : ''}`}
          key={wish.title}
          onClick={() => onSelect(index)}
          aria-label={`Read wish: ${wish.title}`}
        >
          <span />
          <small>0{index + 1}</small>
        </button>
      ))}
      <div className="constellation-center">✦<span>YOUR<br />NORTH STAR</span></div>
    </div>
  )
}

function IndianMemes({ onVideoPlay, onVideoEnd }) {
  const [category, setCategory] = useState('all')
  const [activeVideo, setActiveVideo] = useState(0)
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const autoPausedRef = useRef(false)
  const sectionVisibleRef = useRef(false)
  const categories = ['all', ...new Set(birthdayData.indianMemes.map((meme) => meme.category))]
  const memes = birthdayData.indianMemes.filter((meme) => category === 'all' || meme.category === category)
  const activeMeme = memes[activeVideo % memes.length] || birthdayData.indianMemes[0]

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      const video = videoRef.current
      if (!video) return
      if (!entry.isIntersecting) {
        sectionVisibleRef.current = false
        if (!video.paused) {
          video.pause()
          autoPausedRef.current = true
        }
        onVideoEnd()
      } else {
        sectionVisibleRef.current = true
        video.muted = false
        if (autoPausedRef.current || video.paused) {
          video.play().catch((error) => {
            console.error('Unable to play birthday video with sound.', error)
            video.muted = true
            video.play().catch((fallbackError) => console.error('Unable to resume birthday video.', fallbackError))
          })
          autoPausedRef.current = false
        }
      }
    }, { threshold: 0.2 })

    observer.observe(section)
    return () => observer.disconnect()
  }, [activeMeme.video, onVideoEnd])

  return (
    <section className="memes-section section-pad" id="memes" ref={sectionRef}>
      <div className="section-heading memories-heading"><span className="section-number">03</span><div><div className="eyebrow">THE DESI COMEDY BREAK</div><h3>Because every<br /><em>birthday needs memes.</em></h3></div><p>Indian family energy.<br />Universal birthday truth.</p></div>
      <div className="meme-filters" role="tablist" aria-label="Meme categories">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => { setCategory(item); setActiveVideo(0) }} role="tab" aria-selected={category === item}>{item}</button>)}</div>
      <div className="meme-reel">
        <div className="meme-video-wrap">
          <video
            ref={videoRef}
            key={activeMeme.video}
            src={activeMeme.video}
            muted
            autoPlay
            playsInline
            onLoadedMetadata={(event) => {
              if (sectionVisibleRef.current) {
                event.currentTarget.muted = false
                event.currentTarget.play().catch((error) => console.error('Unable to play birthday video with sound.', error))
              }
            }}
            onPlay={onVideoPlay}
            onEnded={() => { onVideoEnd(); setActiveVideo((index) => (index + 1) % memes.length) }}
          />
          <div className="meme-video-shade" />
          <span className="meme-video-badge">BHAI KA BIRTHDAY / REEL {activeVideo + 1} OF {memes.length}</span>
          <span className="meme-video-progress"><i /></span>
        </div>
        <div className="meme-reel-copy"><span>{activeMeme.emoji} {activeMeme.label}</span><p>{activeMeme.setup}</p><strong>{activeMeme.punchline}</strong><div className="meme-reel-controls">{memes.map((meme, index) => <button key={meme.video} className={index === activeVideo % memes.length ? 'active' : ''} onClick={() => setActiveVideo(index)} aria-label={`Play birthday video ${index + 1}`}>0{index + 1}</button>)}</div></div>
      </div>
    </section>
  )
}

function AdminPage({ schedule, profile, scheduleError, profileError, onSave, onClear, onSaveProfile, onBack }) {
  const [value, setValue] = useState(schedule || '')
  const [name, setName] = useState(profile.name || birthdayData.name)
  const [mainImage, setMainImage] = useState(null)
  const [memoryImages, setMemoryImages] = useState([])
  const [profileSaved, setProfileSaved] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = (event) => {
    event.preventDefault()
    if (!value) return
    onSave(value)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    await onSaveProfile({ name, mainImage, memoryImages })
    setProfileSaved(true)
    window.setTimeout(() => setProfileSaved(false), 1800)
    setMainImage(null)
    setMemoryImages([])
    event.currentTarget.reset()
  }

  return (
    <section className="admin-screen">
      <div className="admin-card">
        <div className="eyebrow">PRIVATE CONTROL ROOM</div>
        <h1>Schedule the<br /><em>big reveal.</em></h1>
        <p>Choose the local date and time when the birthday experience should unlock for visitors.</p>
        <form onSubmit={save}>
          <label htmlFor="open-at">OPEN DATE &amp; TIME</label>
          <input id="open-at" type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} required />
          <button className="admin-save" type="submit">{saved ? 'Schedule saved' : 'Save schedule'} <ArrowRight size={15} /></button>
        </form>
        <div className="admin-actions">
          <button type="button" onClick={onClear}>Open immediately</button>
          <button type="button" onClick={onBack}>Back to celebration</button>
        </div>
        {scheduleError && <div className="admin-error">{scheduleError}</div>}
        {schedule && <div className="admin-status">Currently scheduled for <strong>{new Date(schedule).toLocaleString()}</strong></div>}
        <form className="admin-profile-form" onSubmit={saveProfile}>
          <div className="admin-divider"><span>PERSONALIZATION</span></div>
          <label htmlFor="birthday-name">BIRTHDAY PERSON&apos;S NAME</label>
          <input id="birthday-name" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          <label htmlFor="main-image">MAIN PHOTO</label>
          <input id="main-image" type="file" accept="image/*" onChange={(event) => setMainImage(event.target.files?.[0] || null)} />
          <label htmlFor="memory-images">MEMORY PHOTOS <small>(up to 3)</small></label>
          <input id="memory-images" type="file" accept="image/*" multiple onChange={(event) => setMemoryImages(Array.from(event.target.files || []).slice(0, 3))} />
          <button className="admin-save" type="submit">{profileSaved ? 'Profile saved globally' : 'Save name & images'} <ArrowRight size={15} /></button>
          {profileError && <div className="admin-error">{profileError}</div>}
        </form>
      </div>
    </section>
  )
}

function LockedScreen({ openAt }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(openAt).getTime() - Date.now()))

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(openAt).getTime() - Date.now())), 1000)
    return () => window.clearInterval(timer)
  }, [openAt])

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <section className="locked-screen">
      <FloatingStars />
      <div className="locked-card">
        <div className="eyebrow">A PRIVATE CELEBRATION</div>
        <div className="locked-glyph">✦</div>
        <h1>The surprise<br /><em>is waiting.</em></h1>
        <p>This little world opens on<br /><strong>{new Date(openAt).toLocaleString()}</strong></p>
        <div className="countdown"><span><b>{String(days).padStart(2, '0')}</b><small>DAYS</small></span><i>:</i><span><b>{String(hours).padStart(2, '0')}</b><small>HOURS</small></span><i>:</i><span><b>{String(minutes).padStart(2, '0')}</b><small>MINUTES</small></span><i>:</i><span><b>{String(seconds).padStart(2, '0')}</b><small>SECONDS</small></span></div>
      </div>
    </section>
  )
}

function App() {
  const [started, setStarted] = useState(false)
  const [showBalloonRelease, setShowBalloonRelease] = useState(false)
  const [wished, setWished] = useState(false)
  const [activeMemory, setActiveMemory] = useState(null)
  const [musicOn, setMusicOn] = useState(false)
  const [messageVisible, setMessageVisible] = useState(false)
  const [selectedConstellation, setSelectedConstellation] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [schedule, setSchedule] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [profile, setProfile] = useState({})
  const [profileError, setProfileError] = useState('')
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin')
  const [now, setNow] = useState(() => Date.now())
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const musicRef = useRef(null)
  const musicWasPlayingRef = useRef(false)
  const springX = useSpring(cursorX, { stiffness: 60, damping: 20 })
  const springY = useSpring(cursorY, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const handleMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      setMouseX(x)
      setMouseY(y)
      cursorX.set(x * 12)
      cursorY.set(y * 12)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [cursorX, cursorY])

  useEffect(() => {
    const handleHash = () => setIsAdmin(window.location.hash === '#admin')
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(PROFILE_DOCUMENT, (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() : {})
      setProfileError('')
    }, (error) => {
      console.error('Unable to load the shared birthday profile.', error)
      setProfileError('The profile could not be loaded. Check your Firestore rules and connection.')
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(SCHEDULE_DOCUMENT, (snapshot) => {
      setSchedule(snapshot.exists() ? snapshot.data().openAt || '' : '')
      setScheduleError('')
      setScheduleLoading(false)
    }, (error) => {
      console.error('Unable to load the shared birthday schedule.', error)
      setScheduleError('The shared schedule could not be loaded. Check your Firestore rules and connection.')
      setScheduleLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!schedule) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [schedule])

  const saveSchedule = (value) => {
    setDoc(SCHEDULE_DOCUMENT, { openAt: value })
      .then(() => setScheduleError(''))
      .catch((error) => {
        console.error('Unable to save the shared birthday schedule.', error)
        setScheduleError('The schedule could not be saved. Check your Firestore rules and connection.')
      })
  }

  const clearSchedule = () => {
    setDoc(SCHEDULE_DOCUMENT, { openAt: '' })
      .then(() => setScheduleError(''))
      .catch((error) => {
        console.error('Unable to clear the shared birthday schedule.', error)
        setScheduleError('The schedule could not be cleared. Check your Firestore rules and connection.')
      })
  }

  const saveProfile = async ({ name, mainImage, memoryImages }) => {
    try {
      const currentMemories = profile.memories || birthdayData.memories.map((memory) => memory.image)
      const upload = async (file, path) => {
        if (!file) return null
        return getDownloadURL(await uploadBytes(storageRef(storage, path), file))
      }
      const uploadedMainImage = await upload(mainImage, `birthday/main-${Date.now()}`)
      const uploadedMemories = await Promise.all(memoryImages.map((file, index) => upload(file, `birthday/memory-${index}-${Date.now()}`)))
      await setDoc(PROFILE_DOCUMENT, {
        name: name.trim(),
        ...(uploadedMainImage ? { mainImage: uploadedMainImage } : {}),
        memories: currentMemories.map((image, index) => uploadedMemories[index] || image),
      }, { merge: true })
      setProfileError('')
    } catch (error) {
      console.error('Unable to save the shared birthday profile.', error)
      setProfileError('The profile could not be saved. Check Firebase Storage rules and connection.')
    }
  }

  const goToAdmin = () => {
    window.location.hash = 'admin'
  }

  const goBack = () => {
    window.location.hash = ''
  }

  const person = {
    ...birthdayData,
    ...profile,
    memories: birthdayData.memories.map((memory, index) => ({
      ...memory,
      image: profile.memories?.[index] || memory.image,
    })),
  }

  const toggleMusic = async () => {
    const audio = musicRef.current
    if (!audio) return
    if (musicOn) {
      audio.pause()
      setMusicOn(false)
      return
    }

    try {
      await audio.play()
      setMusicOn(true)
    } catch (error) {
      console.error('Unable to play birthday music.', error)
    }
  }

  const pauseMusicForVideo = () => {
    const audio = musicRef.current
    musicWasPlayingRef.current = Boolean(audio && !audio.paused)
    audio?.pause()
  }

  const resumeMusicAfterVideo = () => {
    if (!musicOn || !musicRef.current || !musicRef.current.paused) return
    musicRef.current.play().catch((error) => console.error('Unable to resume birthday music.', error))
    musicWasPlayingRef.current = false
  }

  const openSurprise = () => {
    setShowBalloonRelease(true)
    setStarted(true)
    musicRef.current?.play()
      .then(() => setMusicOn(true))
      .catch((error) => console.error('Unable to start birthday music.', error))
  }

  const replay = () => {
    setStarted(false)
    setShowBalloonRelease(false)
    setWished(false)
    setMessageVisible(false)
    setSelectedConstellation(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`app ${isPaused ? 'is-paused' : ''}`}>
      <audio ref={musicRef} src="/audio/happy-birthday.mp3" loop preload="auto" />
      <AnimatePresence mode="wait">
        {isAdmin ? <AdminPage key="admin" schedule={schedule} profile={profile} scheduleError={scheduleError} profileError={profileError} onSave={saveSchedule} onClear={clearSchedule} onSaveProfile={saveProfile} onBack={goBack} /> : scheduleLoading ? <LockedScreen key="loading" openAt={new Date(now + 60000).toISOString()} /> : schedule && new Date(schedule).getTime() > now ? <LockedScreen key="locked" openAt={schedule} /> : !started ? <Intro key="intro" onOpen={openSurprise} onAdmin={goToAdmin} /> : (
          <motion.main key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            {showBalloonRelease && <BalloonRelease />}
            <FloatingStars />
            <header className="site-nav">
              <span className="nav-mark">S<span>•</span>24</span>
              <div className="nav-controls">
                <button aria-label={musicOn ? 'Mute music' : 'Play music'} onClick={toggleMusic}>{musicOn ? <Volume2 size={17} /> : <VolumeX size={17} />}<span>{musicOn ? 'Sound on' : 'Sound off'}</span></button>
                <button aria-label={isPaused ? 'Play animations' : 'Pause animations'} onClick={() => setIsPaused(!isPaused)}>{isPaused ? <Play size={16} /> : <Pause size={16} />}</button>
              </div>
            </header>

            <section className="hero-section section-pad">
              <div className="hero-copy">
                <motion.div className="eyebrow" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>THE DAY HAS ARRIVED <span>✦</span></motion.div>
                <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>Happy Birthday,<br /><em>{person.name}.</em></motion.h2>
                <motion.p className="lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>{birthdayData.introMessage}</motion.p>
                <motion.div className="hero-details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}><span>{String(birthdayData.age).padStart(2, '0')} / YEARS OF MAGIC</span><i /><span>THIS IS YOUR YEAR</span></motion.div>
              </div>
              <motion.div className="portrait-wrap" style={{ x: springX, y: springY, rotateY: mouseX * 4, rotateX: mouseY * -4 }}>
                <div className="portrait-orbit orbit-a" /><div className="portrait-orbit orbit-b" />
                <div className="portrait-card"><img src={person.mainImage} alt={`${person.name} birthday portrait`} /><div className="portrait-shine" /><span className="portrait-label">EST. 2002</span></div>
                <span className="orbit-note note-a">A YEAR TO<br />REMEMBER</span><span className="orbit-note note-b">✦</span>
              </motion.div>
              <a className="down-link" href="#wish"><ArrowDown size={15} /> Scroll to celebrate</a>
            </section>

            <section className="wish-section section-pad" id="wish">
              <div className="section-heading"><span className="section-number">01</span><div><div className="eyebrow">A MOMENT JUST FOR YOU</div><h3>Close your eyes.<br /><em>Make it count.</em></h3></div></div>
              <div className="cake-layout">
                <Cake wished={wished} onWish={() => setWished(true)} />
                <div className="wish-copy"><span className="quote-mark">“</span><p>There is something powerful about wishing for the life you deserve.</p><span className="small-rule" /><span className="eyebrow">THE CANDLES ARE YOURS TO BLOW</span></div>
              </div>
            </section>
            <Confetti active={wished} />

            <section className="memories-section section-pad" id="memories">
              <div className="section-heading memories-heading"><span className="section-number">02</span><div><div className="eyebrow">THE GOOD STUFF</div><h3>A few of our<br /><em>favorite things.</em></h3></div><p>Every beautiful life is made<br />of small, beautiful moments.</p></div>
              <div className="memories-grid">{person.memories.map((memory, index) => <motion.button className={`memory-card memory-${index + 1}`} key={memory.title} whileHover={{ y: -10, rotate: index === 1 ? 2 : -2 }} onClick={() => setActiveMemory(memory)}><span className="memory-image"><img src={memory.image} alt={memory.title} /></span><span className="memory-meta"><b>{memory.title}</b><small>{memory.caption}</small></span><Maximize2 size={15} /></motion.button>)}</div>
            </section>

            <IndianMemes onVideoPlay={pauseMusicForVideo} onVideoEnd={resumeMusicAfterVideo} />

            <section className="constellation-section section-pad" id="constellation">
              <div className="section-heading"><span className="section-number">04</span><div><div className="eyebrow">A MAP OF POSSIBILITY</div><h3>Choose a star.<br /><em>Find your wish.</em></h3></div></div>
              <div className="constellation-layout">
                <Constellation selected={selectedConstellation} onSelect={setSelectedConstellation} />
                <motion.div className="constellation-copy" key={selectedConstellation} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
                  <span className="constellation-index">0{selectedConstellation + 1} / 04</span>
                  <h4>{birthdayData.constellation[selectedConstellation].title}</h4>
                  <p>{birthdayData.constellation[selectedConstellation].text}</p>
                  <div className="constellation-prompt">Tap another star to continue <ArrowRight size={14} /></div>
                </motion.div>
              </div>
            </section>

            <section className="timeline-section section-pad" id="journey">
              <div className="section-heading"><span className="section-number">05</span><div><div className="eyebrow">THE STORY SO FAR</div><h3>Look how far<br /><em>you've come.</em></h3></div></div>
              <div className="timeline">{birthdayData.milestones.map((milestone, index) => <motion.div className="timeline-item" key={milestone.year} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }}><span className="timeline-dot" /><span className="timeline-year">{milestone.year}</span><div><h4>{milestone.title}</h4><p>{milestone.text}</p></div></motion.div>)}</div>
            </section>

            <section className="message-section section-pad" id="message">
              <div className="message-orb" style={{ transform: `translate(${mouseX * -8}px, ${mouseY * -8}px)` }} />
              <div className="section-heading"><span className="section-number">06</span><div><div className="eyebrow">A NOTE FROM THE HEART</div><h3>For the person who<br /><em>makes life brighter.</em></h3></div></div>
              <div className="letter-card">
                <span className="letter-top">DEAR {person.name.toUpperCase()},</span>
                <div className="letter-lines">{birthdayData.birthdayMessage.map((line, index) => <motion.p key={line} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.2 }}>{line}</motion.p>)}</div>
                <button className="reveal-button" onClick={() => setMessageVisible(!messageVisible)}>{messageVisible ? 'Hide your wishes' : 'Read your wishes'} <ArrowRight size={15} /></button>
                <AnimatePresence>{messageVisible && <motion.div className="wish-list" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>{birthdayData.wishes.map((wish, index) => <div key={wish}><span>0{index + 1}</span>{wish}<Heart size={13} /></div>)}</motion.div>}</AnimatePresence>
                <div className="signature"><span>Always in your corner,</span><strong>{birthdayData.senderName}</strong></div>
              </div>
            </section>

            <section className="gratitude-section section-pad">
              <div className="gratitude-glow" />
              <div className="gratitude-content"><div className="eyebrow">A LITTLE GRATITUDE GARDEN</div><h3>Some things deserve<br /><em>to be said out loud.</em></h3><div className="gratitude-list">{birthdayData.gratitude.map((item, index) => <motion.div key={item} initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.18 }}><span>✦</span><p>{item}</p></motion.div>)}</div></div>
            </section>

            <section className="finale-section section-pad">
              <div className="firework firework-one" /><div className="firework firework-two" /><div className="firework firework-three" />
              <div className="finale-content"><div className="eyebrow">THE BEGINNING OF SOMETHING BEAUTIFUL</div><h3>Happy Birthday<br /><em>Again, {person.name}.</em></h3><div className="finale-line" /><p>Here&apos;s to another orbit around the sun.</p><Button className="outline-button" onClick={replay}><RotateCcw size={15} /> Replay the magic</Button></div>
              <footer><span>MADE WITH <Heart size={12} fill="currentColor" /> FOR {person.name.toUpperCase()}</span><span>© {new Date().getFullYear()} / ALL THE LOVE</span></footer>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
      <AnimatePresence>{activeMemory && <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveMemory(null)}><button className="close-lightbox" aria-label="Close preview" onClick={() => setActiveMemory(null)}><X /></button><div className="lightbox-content" onClick={(event) => event.stopPropagation()}><img src={activeMemory.image} alt={activeMemory.title} /><div><span className="eyebrow">MEMORY / {activeMemory.title.toUpperCase()}</span><p>{activeMemory.caption}</p></div></div></motion.div>}</AnimatePresence>
    </div>
  )
}

export default App
