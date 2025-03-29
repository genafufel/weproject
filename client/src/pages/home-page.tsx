import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";

// Fields for categories section
const fields = [
  {
    title: "IT & Technology",
    description: "Web development, mobile apps, software engineering, and more.",
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 287,
  },
  {
    title: "Art & Design",
    description: "Graphic design, UX/UI, animation, illustration, and visual arts.",
    image: "https://images.unsplash.com/photo-1526289034009-0240ddb68ce3?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 145,
  },
  {
    title: "Event Management",
    description: "Event planning, coordination, marketing, and production.",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 89,
  },
  {
    title: "Finance & Business",
    description: "Business analysis, financial planning, accounting, and consulting.",
    image: "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 124,
  },
];

// Steps for How It Works section
const steps = [
  {
    number: "1",
    title: "Create Your Profile",
    description: "Sign up and create a detailed profile showcasing your skills, experience, and interests."
  },
  {
    number: "2",
    title: "Browse Opportunities",
    description: "Explore projects or talent based on your needs, with powerful filters to find the perfect match."
  },
  {
    number: "3",
    title: "Connect & Discuss",
    description: "Reach out through our messaging system to discuss project details and requirements."
  },
  {
    number: "4",
    title: "Collaborate & Succeed",
    description: "Work together to bring your projects to life and build your portfolio of success."
  }
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Connect. Create.</span>
                    <span className="block text-primary">Launch Together.</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Join the platform that brings students and startups together. Find opportunities to build your experience or discover fresh talent for your next project.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link href="/projects">
                        <Button size="lg" className="w-full">
                          Find Projects
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link href={user ? "/create-project" : "/auth"}>
                        <Button size="lg" variant="outline" className="w-full">
                          Post a Project
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop"
              alt="Students collaborating on a project"
            />
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Fields</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
                Explore Projects in Various Fields
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Connect with projects and opportunities across different industries.
              </p>
            </div>
            
            <div className="mt-10">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field) => (
                  <div key={field.title} className="group relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className="aspect-w-3 aspect-h-2">
                      <img 
                        src={field.image} 
                        alt={field.title} 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">
                        <Link href={`/projects?field=${encodeURIComponent(field.title)}`} className="focus:outline-none">
                          {field.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {field.description}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm font-medium text-primary">
                          {field.count} active projects
                        </span>
                        <Link 
                          href={`/projects?field=${encodeURIComponent(field.title)}`}
                          className="text-sm font-medium text-primary hover:text-blue-700"
                        >
                          View all <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">How It Works</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Simple Steps to Get Started
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Whether you're looking for projects or recruiting talent, our platform makes it easy.
              </p>
            </div>
            
            <div className="mt-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step) => (
                  <div key={step.number} className="relative">
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <span className="text-xl font-bold">{step.number}</span>
                    </div>
                    <div className="ml-16">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-base text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-primary">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to find your next opportunity?</span>
              <span className="block text-blue-100">Join thousands of students and startups today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button variant="secondary" size="lg">
                    {user ? "Go to Dashboard" : "Create Account"}
                  </Button>
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link href="/projects">
                  <Button variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Learn more
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
