import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Mail, Calendar, Building, GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TalentDetail() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Extract resume ID from the URL
  const resumeId = parseInt(location.split("/")[2]);
  
  // In a real implementation, we would fetch the resume data from the API
  // For now, use mock data similar to what we used in the talent page
  const mockResumes = [
    {
      id: 1,
      userId: 1,
      user: { 
        id: 1,
        fullName: "Sarah Johnson", 
        email: "sarah.johnson@example.com",
        avatar: null 
      },
      title: "UX/UI Designer",
      direction: "Graphic Design",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research", "Wireframing", "UI Design", "Usability Testing"],
      talents: ["Illustration", "Photography", "Visual Communication"],
      education: [
        { 
          institution: "Design Institute", 
          degree: "Bachelor's", 
          fieldOfStudy: "UI/UX Design",
          startDate: "2018",
          endDate: "2022",
          description: "Specialized in user interface design with a focus on mobile applications."
        }
      ],
      experience: [
        {
          company: "Tech Startup",
          position: "UX Design Intern",
          startDate: "2021",
          endDate: "2022",
          description: "Collaborated with product team to redesign the user onboarding experience, resulting in a 15% increase in user retention."
        }
      ],
      createdAt: "2023-04-15T12:00:00Z"
    },
    {
      id: 2,
      userId: 2,
      user: { 
        id: 2,
        fullName: "Jamal Thompson", 
        email: "jamal.thompson@example.com",
        avatar: null 
      },
      title: "Full Stack Developer",
      direction: "Computer Science",
      skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript", "TypeScript", "RESTful APIs", "GraphQL"],
      talents: ["Problem Solving", "Technical Writing", "Open Source Contribution"],
      education: [
        { 
          institution: "Tech University", 
          degree: "Master's", 
          fieldOfStudy: "Computer Science",
          startDate: "2020",
          endDate: "2022",
          description: "Specialized in web development and cloud computing."
        }
      ],
      experience: [
        {
          company: "Software Solutions",
          position: "Junior Developer",
          startDate: "2022",
          endDate: "Present",
          description: "Develop and maintain web applications using React and Node.js. Implemented new features that improved user engagement by 20%."
        }
      ],
      createdAt: "2023-05-20T12:00:00Z"
    },
    {
      id: 3,
      userId: 3,
      user: { 
        id: 3,
        fullName: "Emma Chen", 
        email: "emma.chen@example.com",
        avatar: null 
      },
      title: "Marketing Specialist",
      direction: "Marketing",
      skills: ["Social Media", "SEO", "Analytics", "Content Strategy", "Email Marketing", "Campaign Management", "Market Research"],
      talents: ["Copywriting", "Public Speaking", "Graphic Design"],
      education: [
        { 
          institution: "Business School", 
          degree: "Bachelor's", 
          fieldOfStudy: "Marketing",
          startDate: "2019",
          endDate: "2023",
          description: "Focused on digital marketing and consumer behavior."
        }
      ],
      experience: [
        {
          company: "Marketing Agency",
          position: "Marketing Assistant",
          startDate: "2022",
          endDate: "2023",
          description: "Assisted in planning and executing social media campaigns for clients across various industries."
        }
      ],
      createdAt: "2023-06-10T12:00:00Z"
    },
    {
      id: 4,
      userId: 4,
      user: { 
        id: 4,
        fullName: "Marco Silva", 
        email: "marco.silva@example.com",
        avatar: null 
      },
      title: "Data Analyst",
      direction: "Information Technology",
      skills: ["Python", "SQL", "Tableau", "Data Visualization", "Statistical Analysis", "Excel", "Power BI"],
      talents: ["Data Storytelling", "Critical Thinking", "Process Optimization"],
      education: [
        { 
          institution: "Analytics University", 
          degree: "Bachelor's", 
          fieldOfStudy: "Data Science",
          startDate: "2017",
          endDate: "2021",
          description: "Focused on data analysis techniques and business intelligence."
        }
      ],
      experience: [
        {
          company: "Data Insights Co.",
          position: "Junior Data Analyst",
          startDate: "2021",
          endDate: "Present",
          description: "Analyze customer data to extract actionable insights for business strategy. Created dashboards that improved decision making across departments."
        }
      ],
      createdAt: "2023-03-15T12:00:00Z"
    }
  ];
  
  // Find the resume with the matching ID
  const resume = mockResumes.find(r => r.id === resumeId);
  
  // Loading state (in a real implementation, this would use the loading state from useQuery)
  const isLoading = false;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Error state
  if (!resume) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Not Found</h1>
              <p className="text-gray-600 mb-8">The profile you're looking for doesn't exist or has been removed.</p>
              <Button asChild>
                <Link href="/talent">Browse All Talent</Link>
              </Button>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="pl-0">
              <Link href="/talent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Talent
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={resume.user.avatar || undefined} alt={resume.user.fullName} />
                      <AvatarFallback className="text-xl">
                        {resume.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h1 className="text-2xl font-bold text-gray-900">{resume.user.fullName}</h1>
                    <p className="text-primary font-medium">{resume.title}</p>
                    <p className="text-gray-500 mt-1">{resume.direction}</p>
                    
                    <div className="mt-6 w-full">
                      {user?.userType === "projectOwner" ? (
                        <Button className="w-full" asChild>
                          <Link href={`/messages?userId=${resume.user.id}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Contact
                          </Link>
                        </Button>
                      ) : !user ? (
                        <Button className="w-full" asChild>
                          <Link href="/auth">
                            <Mail className="mr-2 h-4 w-4" />
                            Sign in to Contact
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Skills card */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Special talents card */}
              {resume.talents && resume.talents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Talents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {resume.talents.map((talent, index) => (
                        <Badge key={index} variant="secondary">{talent}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Resume details */}
              <Card>
                <CardHeader>
                  <CardTitle>Resume Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span>{formatDate(resume.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Field</span>
                    <span>{resume.direction}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Education section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {resume.education.map((edu, index) => (
                    <div key={index} className={index > 0 ? "mt-6 pt-6 border-t border-gray-200" : ""}>
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{edu.institution}</h3>
                        <span className="text-gray-500 text-sm">{edu.startDate} - {edu.endDate || "Present"}</span>
                      </div>
                      <p className="text-primary">{edu.degree} in {edu.fieldOfStudy}</p>
                      {edu.description && <p className="mt-2 text-gray-600">{edu.description}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Experience section */}
              {resume.experience && resume.experience.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5 text-primary" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resume.experience.map((exp, index) => (
                      <div key={index} className={index > 0 ? "mt-6 pt-6 border-t border-gray-200" : ""}>
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium text-gray-900">{exp.company}</h3>
                          <span className="text-gray-500 text-sm">{exp.startDate} - {exp.endDate || "Present"}</span>
                        </div>
                        <p className="text-primary">{exp.position}</p>
                        {exp.description && <p className="mt-2 text-gray-600">{exp.description}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {/* Projects CTA for project owners */}
              {user?.userType === "projectOwner" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Looking for talent like {resume.user.fullName.split(' ')[0]}?</CardTitle>
                    <CardDescription>
                      Post a project to connect with talented individuals who match your requirements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <Link href="/create-project">Post a Project</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
