import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Project fields for filtering
const projectFields = [
  { value: "all", label: "All Fields" },
  { value: "IT", label: "IT & Technology" },
  { value: "Design", label: "Art & Design" },
  { value: "Events", label: "Event Management" },
  { value: "Finance", label: "Finance & Business" },
  { value: "Marketing", label: "Marketing & PR" },
  { value: "Education", label: "Education & Training" },
  { value: "Research", label: "Research & Science" },
  { value: "Writing", label: "Writing & Content" },
  { value: "Other", label: "Other" },
];

export default function Projects() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Parse URL parameters
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [selectedField, setSelectedField] = useState(params.get("field") || "all");
  const [remoteOnly, setRemoteOnly] = useState(params.get("remote") === "true");
  
  // Build query string for API
  const buildQueryString = () => {
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.append("search", searchTerm);
    if (selectedField && selectedField !== "all") queryParams.append("field", selectedField);
    if (remoteOnly) queryParams.append("remote", "true");
    
    return queryParams.toString();
  };
  
  // Update URL with filters
  const updateUrlWithFilters = () => {
    const queryString = buildQueryString();
    setLocation(queryString ? `/projects?${queryString}` : "/projects", { replace: true });
  };
  
  // Fetch projects based on filters
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/projects?${buildQueryString()}`],
  });
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlWithFilters();
  };
  
  // Handle field change
  const handleFieldChange = (value: string) => {
    setSelectedField(value);
    setTimeout(updateUrlWithFilters, 0);
  };
  
  // Handle remote toggle
  const handleRemoteToggle = (checked: boolean) => {
    setRemoteOnly(checked);
    setTimeout(updateUrlWithFilters, 0);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero section */}
        <div className="bg-primary text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-4">Discover Projects</h1>
              <p className="text-blue-100 text-lg mb-8">
                Find exciting opportunities across various fields to build your portfolio and launch your career.
              </p>
              
              {/* Search form */}
              <form onSubmit={handleSearchSubmit} className="flex w-full gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search projects by title or keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white text-gray-900 border-0"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Filters section */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-500">Filters:</span>
                
                <Select value={selectedField} onValueChange={handleFieldChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remote-only"
                    checked={remoteOnly}
                    onCheckedChange={handleRemoteToggle}
                  />
                  <Label htmlFor="remote-only">Remote only</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{isLoading ? "Loading..." : `${projects?.length || 0} results`}</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Sort by
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                      Newest first
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Oldest first
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        
        {/* Projects list */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Failed to load projects. Please try again later.</p>
            </div>
          ) : !projects?.length ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                We couldn't find any projects matching your search criteria.
              </p>
              <Button asChild variant="outline">
                <Link href="/projects">Clear all filters</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: any) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          <Link href={`/projects/${project.id}`}>
                            <a className="hover:text-primary">{project.title}</a>
                          </Link>
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Posted by <span className="text-primary">{project.ownerName || "Project Owner"}</span>
                        </p>
                      </div>
                      <Badge>{project.field}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 line-clamp-3 mb-4">{project.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Positions needed:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(project.positions || []).map((position: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-blue-50">
                            {position}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center pt-0">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{project.remote ? "Remote" : project.location || "No location specified"}</span>
                    </div>
                    
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="default" size="sm">
                        Apply Now
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Post a project CTA for non-applicants */}
          {user?.userType === "projectOwner" && (
            <div className="mt-12 bg-primary rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Need more talent for your projects?</h2>
              <p className="mb-6 text-blue-100">
                Post a new project to connect with talented students and early-career professionals.
              </p>
              <Link href="/create-project">
                <Button variant="secondary" size="lg">
                  Post a New Project
                </Button>
              </Link>
            </div>
          )}
          
          {/* Create account CTA for non-logged in users */}
          {!user && (
            <div className="mt-12 bg-primary rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to apply for projects?</h2>
              <p className="mb-6 text-blue-100">
                Create an account to apply for projects and build your portfolio.
              </p>
              <Link href="/auth">
                <Button variant="secondary" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
