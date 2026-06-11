import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { CalendarCheck, Satellite, Bell, History, Camera, Tag, CheckCircle, ArrowRight, Car, Wrench, Shield } from 'lucide-react'

const StatusStep = ({ done, active, label }) => (
  <div className={`flex items-center gap-2 text-xs font-medium ${done ? 'text-green-600' : active ? 'text-primary font-bold' : 'text-gray-400'}`}>
    {done ? <CheckCircle size={13} /> : active ? <ArrowRight size={13} /> : <div className="w-3 h-3 rounded-full border border-current" />}
    {label}
  </div>
)

export default function HomePage() {
  return (
    <div>
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen pt-[70px] bg-[#F5F3EE] flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-xs font-bold tracking-widest text-gray-500 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full" />
              LILONGWE'S PREMIER GARAGE
            </div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.1] text-dark mb-5">
              Your Car.<br />
              <em className="text-primary">Our Expertise.</em><br />
              Zero Guesswork.
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-md">Book appointments, track repairs in real-time, and get notified the moment your vehicle is ready — all from your phone.</p>
            <div className="flex gap-3 flex-wrap mb-12">
              <Link to="/booking" className="flex items-center gap-2 px-7 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30">
                <CalendarCheck size={18} /> Book Appointment
              </Link>
              <Link to="/track" className="px-7 py-4 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all">
                Track My Vehicle
              </Link>
            </div>
            <div className="flex items-center gap-0">
              {[['2,400+', 'Vehicles Serviced'], ['12+', 'Years Experience'], ['98%', 'Satisfaction Rate']].map(([num, label], i) => (
                <div key={i} className="flex items-center gap-6">
                  {i > 0 && <div className="w-px h-10 bg-gray-200 mx-2" />}
                  <div>
                    <div className="text-2xl font-black text-dark">{num}</div>
                    <div className="text-xs text-gray-500 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image + Floating Card */}
          <div className="relative hidden md:block">
            <div className="h-[560px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-dark via-dark-2 to-[#0F3460] flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-36 h-36 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                  <Car size={56} className="text-primary drop-shadow-[0_0_20px_rgba(184,134,11,0.6)]" />
                </div>
                <p className="font-display text-2xl font-bold">AutoMedic Workshop</p>
                <p className="text-white/50 text-sm uppercase tracking-widest mt-1">Professional Service — Lilongwe</p>
              </div>
            </div>

            {/* Floating status card */}
            <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl p-5 shadow-2xl min-w-[260px] animate-float">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm text-dark">Vehicle Repair Status</span>
                <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full">Live</span>
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {[['done','Appointment Confirmed'],['done','Vehicle Received'],['done','Diagnosis Complete'],['active','Repair In Progress'],['','Quality Inspection'],['','Ready for Collection']].map(([s,l],i) => (
                  <StatusStep key={i} done={s==='done'} active={s==='active'} label={l} />
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1"><span>Progress</span><span>65%</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gradient-to-r from-primary to-yellow-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-primary uppercase mb-3">Why AutoMedic</div>
          <h2 className="font-display text-4xl text-dark mb-12">Everything You Need,<br /><em className="text-primary">In One Platform</em></h2>
          <div className="grid md:grid-cols-3 gap-7">
            {[
              { icon: Satellite, bg: 'bg-orange-50', color: 'text-orange-600', title: 'Real-Time Tracking', desc: "Watch your vehicle's repair progress live. No more calling to ask 'is my car ready?'" },
              { icon: CalendarCheck, bg: 'bg-green-50', color: 'text-green-600', title: 'Online Booking', desc: 'Book your service appointment 24/7 from your phone, without waiting in queues.' },
              { icon: Bell, bg: 'bg-blue-50', color: 'text-blue-600', title: 'Instant Notifications', desc: 'Get WhatsApp alerts at every stage — when work starts, parts arrive, and when to collect.' },
              { icon: History, bg: 'bg-purple-50', color: 'text-purple-600', title: 'Full Repair History', desc: 'Access your complete service history, invoices, and photos from every past repair.' },
              { icon: Camera, bg: 'bg-pink-50', color: 'text-pink-600', title: 'Photo Documentation', desc: 'Technicians upload before/during/after photos. You see exactly what was done.' },
              { icon: Tag, bg: 'bg-green-50', color: 'text-green-700', title: 'Transparent Pricing', desc: 'See service prices upfront. No hidden charges, no surprises when you collect.' },
            ].map(({ icon: Icon, bg, color, title, desc }, i) => (
              <div key={i} className="p-8 bg-[#F5F3EE] rounded-2xl border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className={`w-13 h-13 ${bg} ${color} rounded-2xl flex items-center justify-center mb-5`} style={{width:52,height:52}}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-dark mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 bg-dark overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-6 mb-6">
            {[Car, Wrench, Shield].map((Icon, i) => <Icon key={i} size={28} className="text-primary/80" />)}
          </div>
          <h2 className="font-display text-4xl text-white mb-3">Ready to Book Your Service?</h2>
          <p className="text-white/70 text-lg mb-8">Join thousands of Lilongwe drivers who trust AutoMedic</p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30">
            <CalendarCheck size={18} /> Book an Appointment Today
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
