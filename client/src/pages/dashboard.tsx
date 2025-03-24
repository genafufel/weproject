import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { PlusIcon, Briefcase, FileText, Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch user's projects if they are a project owner
  const {
    data: projects,
    isLoading: projectsLoading,
  } = useQuery({
    queryKey: [`/api/projects?userId=${user?.id}`],
    enabled: user?.userType === "projectOwner",
  });

  // Fetch user's resumes if they are an applicant
  const {
    data: resumes,
    isLoading: resumesLoading,
  } = useQuery({
    queryKey: [`/api/resumes?userId=${user?.id}`],
    enabled: user?.userType === "applicant",
  });

  // Fetch user's applications if they are an applicant
  const {
    data: applications,
    isLoading: applicationsLoading,
  } = useQuery({
    queryKey: ["/api/applications"],
    enabled: user?.userType === "applicant",
  });

  // Fetch applications for user's projects if they are a project owner
  const {
    data: projectApplications,
    isLoading: projectApplicationsLoading,
  } = useQuery({
    queryKey: ["/api/applications"],
    enabled: user?.userType === "projectOwner" && projects?.length > 0,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Welcome back, {user?.fullName}! Manage your {user?.userType === "projectOwner" ? "projects" : "resumes"} and applications.
            </p>
          </div>
          
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {user?.userType === "projectOwner" ? (
                <TabsTrigger value="projects">My Projects</TabsTrigger>
              ) : (
                <TabsTrigger value="resumes">My Resumes</TabsTrigger>
              )}
              <TabsTrigger value="applications">
                {user?.userType === "projectOwner" ? "Project Applications" : "My Applications"}
              </TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription>
                      Your activity summary
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user?.userType === "projectOwner" ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Active Projects</span>
                            <span className="text-lg font-medium">{projectsLoading ? "-" : projects?.length || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Applications Received</span>
                            <span className="text-lg font-medium">{projectApplicationsLoading ? "-" : projectApplications?.length || 0}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Resumes</span>
                            <span className="text-lg font-medium">{resumesLoading ? "-" : resumes?.length || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Applications Sent</span>
                            <span className="text-lg font-medium">{applicationsLoading ? "-" : applications?.length || 0}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Unread Messages</span>
                        <span className="text-lg font-medium">0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Create New Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Get Started</CardTitle>
                    <CardDescription>
                      {user?.userType === "projectOwner" 
                        ? "Create a new project or check applications"
                        : "Create a new resume or explore projects"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user?.userType === "projectOwner" ? (
                        <>
                          <Link href="/create-project">
                            <Button className="w-full justify-start" variant="outline">
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Create New Project
                            </Button>
                          </Link>
                          <Link href="/dashboard?tab=applications">
                            <Button className="w-full justify-start" variant="outline">
                              <Inbox className="mr-2 h-4 w-4" />
                              View Applications
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/create-resume">
                            <Button className="w-full justify-start" variant="outline">
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Create New Resume
                            </Button>
                          </Link>
                          <Link href="/projects">
                            <Button className="w-full justify-start" variant="outline">
                              <Briefcase className="mr-2 h-4 w-4" />
                              Browse Projects
                            </Button>
                          </Link>
                        </>
                      )}
                      <Link href="/messages">
                        <Button className="w-full justify-start" variant="outline">
                          <Inbox className="mr-2 h-4 w-4" />
                          Check Messages
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Account Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Info</CardTitle>
                    <CardDescription>
                      Your account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500">Full Name</div>
                        <div className="font-medium">{user?.fullName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Username</div>
                        <div className="font-medium">{user?.username}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">{user?.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Account Type</div>
                        <div className="font-medium capitalize">{user?.userType === "projectOwner" ? "Project Owner" : "Student / Applicant"}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Edit Profile</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* Projects/Resumes Tab */}
            {user?.userType === "projectOwner" ? (
              <TabsContent value="projects">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
                  <Link href="/create-project">
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create Project
                    </Button>
                  </Link>
                </div>
                
                {projectsLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !projects?.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-500 mb-6 text-center max-w-md">
                        You haven't created any projects yet. Create your first project to start finding talent!
                      </p>
                      <Link href="/create-project">
                        <Button>Create Your First Project</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {projects.map((project: any) => (
                      <Card key={project.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{project.title}</CardTitle>
                              <CardDescription>Created on {new Date(project.createdAt).toLocaleDateString()}</CardDescription>
                            </div>
                            <Badge>{project.field}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 line-clamp-2 mb-4">{project.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(project.positions || []).map((position: string, index: number) => (
                              <Badge key={index} variant="outline">{position}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-4">
                              {project.remote ? "Remote" : project.location || "No location specified"}
                            </span>
                            <span>{(project.applications || []).length} applications</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="outline">View Details</Button>
                          </Link>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Button>Edit Project</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ) : (
              <TabsContent value="resumes">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Resumes</h2>
                  <Link href="/create-resume">
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create Resume
                    </Button>
                  </Link>
                </div>
                
                {resumesLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !resumes?.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
                      <p className="text-gray-500 mb-6 text-center max-w-md">
                        You haven't created any resumes yet. Create your first resume to start applying for projects!
                      </p>
                      <Link href="/create-resume">
                        <Button>Create Your First Resume</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {resumes.map((resume: any) => (
                      <Card key={resume.id}>
                        <CardHeader>
                          <CardTitle>{resume.title}</CardTitle>
                          <CardDescription>
                            Created on {new Date(resume.createdAt).toLocaleDateString()} • Last updated on {new Date(resume.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium text-gray-900 mb-2">Direction: {resume.direction}</p>
                          <Separator className="my-4" />
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {(resume.skills || []).map((skill: string, index: number) => (
                                <Badge key={index} variant="outline">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Education</h4>
                            <div className="space-y-2">
                              {(resume.education || []).slice(0, 1).map((edu: any, index: number) => (
                                <div key={index}>
                                  <p className="font-medium">{edu.institution}</p>
                                  <p className="text-sm text-gray-600">{edu.degree}, {edu.fieldOfStudy}</p>
                                  <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || "Present"}</p>
                                </div>
                              ))}
                              {resume.education?.length > 1 && (
                                <p className="text-sm text-gray-500">+{resume.education.length - 1} more</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Link href={`/resumes/${resume.id}`}>
                            <Button variant="outline">View Resume</Button>
                          </Link>
                          <Link href={`/resumes/${resume.id}/edit`}>
                            <Button>Edit Resume</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
            
            {/* Applications Tab */}
            <TabsContent value="applications">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {user?.userType === "projectOwner" ? "Project Applications" : "My Applications"}
              </h2>
              
              {user?.userType === "projectOwner" ? (
                projectApplicationsLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !projectApplications?.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-500 mb-6 text-center max-w-md">
                        You haven't received any applications yet. Make sure your projects are visible in the marketplace.
                      </p>
                      <Link href="/projects">
                        <Button>View Your Projects</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {/* Project applications display would go here */}
                    <p>Project applications display</p>
                  </div>
                )
              ) : (
                applicationsLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !applications?.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-500 mb-6 text-center max-w-md">
                        You haven't applied to any projects yet. Browse the marketplace to find projects that match your skills.
                      </p>
                      <Link href="/projects">
                        <Button>Browse Projects</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {/* User applications display would go here */}
                    <p>User applications display</p>
                  </div>
                )
              )}
            </TabsContent>
            
            {/* Messages Tab */}
            <TabsContent value="messages">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages</h2>
              
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-500 mb-6 text-center max-w-md">
                    You don't have any messages yet. Connect with project owners or applicants to start a conversation.
                  </p>
                  <Link href={user?.userType === "projectOwner" ? "/talent" : "/projects"}>
                    <Button>
                      {user?.userType === "projectOwner" ? "Browse Talent" : "Browse Projects"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
