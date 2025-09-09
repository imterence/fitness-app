"use client"

import { Dumbbell, Users, Target, Award, Clock, Shield, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SplashPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-white">
              <span className="text-red-500">Whatever</span>Fit
            </span>
          </div>
          <Link 
            href="/auth/login"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url('https://a.storyblok.com/f/301853/2000x1251/ece4100012/assets_106a1791992142efae06db192542ec79_8f806819352f4a96b317d6009da745e3.jpeg/m/2600x0/filters:format(webp)')`
          }}
        />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Shape Your <span className="text-red-500">Body</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8 font-light">
            Be <strong className="text-red-500">strong</strong> training hard
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="#about"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About <span className="text-red-500">Us</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              WhateverFit is a cutting-edge fitness platform that connects professional trainers with clients, 
              providing personalized workout programs and comprehensive fitness solutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                Revolutionizing Fitness Training
              </h3>
              <p className="text-lg text-gray-300 mb-6">
                We believe that everyone deserves access to professional fitness guidance. Our platform 
                bridges the gap between expert trainers and fitness enthusiasts, creating a community 
                focused on achieving real results.
              </p>
              <p className="text-lg text-gray-300">
                Whether you're a beginner looking to start your fitness journey or an experienced athlete 
                seeking to push your limits, WhateverFit provides the tools, expertise, and support you need.
              </p>
            </div>
            <div className="relative">
              <div className="bg-red-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-2">Expert Trainers</h4>
                    <p className="text-gray-300 text-sm">Certified professionals</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-2">Personalized Plans</h4>
                    <p className="text-gray-300 text-sm">Tailored to your goals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why <span className="text-red-500">Choose Us</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              PUSH YOUR LIMITS FORWARD with our comprehensive fitness solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center bg-gray-800 p-8 rounded-2xl hover:bg-gray-700 transition-colors duration-200">
              <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Dumbbell className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Coaching Support</h3>
              <p className="text-gray-300">
                Stay on track with regular coaching support from our head coach.
              </p>
            </div>
            
            <div className="text-center bg-gray-800 p-8 rounded-2xl hover:bg-gray-700 transition-colors duration-200">
              <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Community</h3>
              <p className="text-gray-300">
                Join a community with like-minded individuals.
              </p>
            </div>
            
            <div className="text-center bg-gray-800 p-8 rounded-2xl hover:bg-gray-700 transition-colors duration-200">
              <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Flexible Scheduling</h3>
              <p className="text-gray-300">
                Workout plans that fit your lifestyle and schedule
              </p>
            </div>
            
            <div className="text-center bg-gray-800 p-8 rounded-2xl hover:bg-gray-700 transition-colors duration-200">
              <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Science-based approach</h3>
              <p className="text-gray-300">
                Personalized programs designed specifically for your goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Are We Section */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="text-red-500">Trainers</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A dedicated team of fitness professionals committed to transforming lives through movement
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-500/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                <Users className="h-16 w-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Trainer 1</h3>
              <p className="text-gray-300">
                HYROX CHAMPION SINGAPORE <br/>
				HYROX PRO CHAMPION BEIJING
				
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-500/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                <Users className="h-16 w-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Trainer 2</h3>
              <p className="text-gray-300">
                ManHunt 2024 <br/>
				ManHunt 2025 <br/>
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-500/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                <Users className="h-16 w-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Trainer 3</h3>
              <p className="text-gray-300">
                Whatever lahhhhhh
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Fitness Journey?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of users who have transformed their lives with WhateverFit
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Get Started Today
            </Link>
            <Link 
              href="/auth/login"
              className="border-2 border-white text-white hover:bg-white hover:text-red-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200"
            >
              Already a Member? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Dumbbell className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-white">
              <span className="text-red-500">Whatever</span>Fit
            </span>
          </div>
          <p className="text-gray-400 mb-4">
            © 2024 WhateverFit. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Developed by <a href="https://github.com/imterence" target="_blank"> Terence Ong </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
