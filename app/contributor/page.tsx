"use client"

import { Header } from "@/components/header"
import { ExternalLink, Github, Linkedin, Mail, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContributorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Contributors
            </h1>
            <p className="text-lg text-muted-foreground">
              Meet the team behind the DIU Learning Platform
            </p>
          </div>

          {/* Founder Profile Card */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 px-2">Founder & Developer</h2>
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5"></div>
            
            <div className="px-6 md:px-8 pb-8">
              {/* Avatar */}
              <div className="relative -mt-16 mb-6">
                <div className="w-32 h-32 rounded-2xl bg-background border-4 border-background shadow-xl overflow-hidden">
                  <img 
                    src="https://nehal.app/assets/images/profile2.webp"
                    alt="Sheikh Shariar Nehal"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Sheikh Shariar Nehal
                  </h2>
                  <p className="text-xl text-primary font-semibold mb-4">
                    Founder & Full Stack Developer
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Creator of the DIU CSE Learning Platform. Passionate about building educational 
                    technology that empowers students and enhances the learning experience. 
                    Specializing in full-stack development, UI/UX design, and scalable web applications.
                  </p>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={() => window.open('https://www.nehal.app', '_blank')}
                  >
                    <Globe className="h-4 w-4" />
                    Portfolio
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open('https://github.com/sheikhshariarnehal', '_blank')}
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open('https://linkedin.com/in/sheikhshariarnehal', '_blank')}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.location.href = 'mailto:nehaldiu@gmail.com'}
                  >
                    <Mail className="h-4 w-4" />
                    Contact
                  </Button>
                </div>

                {/* Tech Stack */}
                <div className="pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Node.js'].map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg border border-primary/20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">2024</div>
                    <div className="text-sm text-muted-foreground">Founded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">220+</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">24/7</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Other Contributors */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-4 px-2">Contributors</h2>
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5"></div>
              
              <div className="px-6 md:px-8 pb-8">
                {/* Avatar */}
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 rounded-2xl bg-background border-4 border-background shadow-xl overflow-hidden">
                    <img
                      src="/photo_2025-10-25_20-22-50.jpg"
                      alt="Tanvir Mahmud"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      Tanvir Mahmud
                    </h2>
                    <p className="text-xl text-primary font-semibold mb-4">
                      Web and App Developer
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Contributing to the DIU Learning Platform to enhance the educational 
                      experience for students. Passionate about open-source development and 
                      collaborative projects.
                    </p>
                  </div>

                  {/* Links */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open('https://github.com/i-mTanvir/', '_blank')}
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open('https://www.linkedin.com/in/tanvir-mahmud-alamin', '_blank')}
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.location.href = 'mailto:mahmud22205101398@diu.edu.bd'}
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
              <span>💡</span>
              <span>Open to collaboration and feature suggestions</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
