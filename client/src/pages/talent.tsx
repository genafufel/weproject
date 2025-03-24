import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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

// Field directions for filtering
const fieldDirections = [
  { value: "all", label: "All Fields" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "Information Technology", label: "Information Technology" },
  { value: "Graphic Design", label: "Graphic Design" },
  { value: "UX/UI Design", label: "UX/UI Design" },
  { value: "Business Administration", label: "Business Administration" },
  { value: "Marketing", label: "Marketing" },
  { value: "Finance", label: "Finance" },
  { value: "Education", label: "Education" },
  { value: "Engineering", label: "Engineering" },
  { value: "Arts", label: "Arts" },
  { value: "Event Management", label: "Event Management" },
  { value: "Health Sciences", label: "Health Sciences" },
  { value: "Other", label: "Other" },
];

export default function Talent() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Parse URL parameters
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [selectedField, setSelectedField] = useState(params.get("field") || "all");
  
  // Build query string for API
  const buildQueryString = () => {
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.append("search", searchTerm);
    if (selectedField && selectedField !== "all") queryParams.append("field", selectedField);
    
    return queryParams.toString();
  };
  
  // Update URL with filters
  const updateUrlWithFilters = () => {
    const queryString = buildQueryString();
    setLocation(queryString ? `/talent?${queryString}` : "/talent", { replace: true });
  };
  
  // Fetch resumes based on filters
  // This is a mock example since we don't have a specific "browse resumes" endpoint in the API
  const {
    data: resumes,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/resumes?${buildQueryString()}`],
    enabled: false, // Disabled because we don't actually have this endpoint
  });
  
  // Mock resume data (in a real app, this would come from API)
  const mockResumes = [
    {
      id: 1,
      userId: 1,
      user: { fullName: "Sarah Johnson", avatar: null },
      title: "UX/UI Designer",
      direction: "Graphic Design",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
      education: [
        { institution: "Design Institute", degree: "Bachelor's", fieldOfStudy: "UI/UX Design" }
      ]
    },
    {
      id: 2,
      userId: 2,
      user: { fullName: "Jamal Thompson", avatar: null },
      title: "Full Stack Developer",
      direction: "Computer Science",
      skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
      education: [
        { institution: "Tech University", degree: "Master's", fieldOfStudy: "Computer Science" }
      ]
    },
    {
      id: 3,
      userId: 3,
      user: { fullName: "Emma Chen", avatar: null },
      title: "Marketing Specialist",
      direction: "Marketing",
      skills: ["Social Media", "SEO", "Analytics", "Content Strategy"],
      education: [
        { institution: "Business School", degree: "Bachelor's", fieldOfStudy: "Marketing" }
      ]
    },
    {
      id: 4,
      userId: 4,
      user: { fullName: "Marco Silva", avatar: null },
      title: "Data Analyst",
      direction: "Information Technology",
      skills: ["Python", "SQL", "Tableau", "Data Visualization"],
      education: [
        { institution: "Analytics University", degree: "Bachelor's", fieldOfStudy: "Data Science" }
      ]
    }
  ];
  
  // Filter mock resumes based on search and field
  const filteredResumes = mockResumes.filter(resume => {
    const matchesSearch = !searchTerm || 
      resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesField = selectedField === "all" || resume.direction === selectedField;
    
    return matchesSearch && matchesField;
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero section */}
        <div className="bg-primary text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-4">Find Talented Students</h1>
              <p className="text-blue-100 text-lg mb-8">
                Discover motivated students and early-career professionals with fresh ideas and skills.
              </p>
              
              {/* Search form */}
              <form onSubmit={handleSearchSubmit} className="flex w-full gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, skill, or field"
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
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Field of Study" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldDirections.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{`${filteredResumes.length} results`}</span>
                
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
                      Relevance
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Recently active
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        
        {/* Talent list */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Failed to load talent. Please try again later.</p>
            </div>
          ) : !filteredResumes.length ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-6">
                We couldn't find any talent matching your search criteria.
              </p>
              <Button asChild variant="outline">
                <Link href="/talent">Clear all filters</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {filteredResumes.map((resume) => (
                <Card key={resume.id} className="overflow-hidden hover:shadow-md transition-all text-center">
                  <CardHeader className="pb-3 pt-6">
                    <div className="mx-auto h-20 w-20 rounded-full overflow-hidden">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={resume.user.avatar || undefined} alt={resume.user.fullName} />
                        <AvatarFallback className="text-lg">
                          {resume.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{resume.user.fullName}</h3>
                    <p className="text-sm text-gray-500">{resume.title}</p>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <div className="flex flex-wrap justify-center gap-1 mb-4">
                      {resume.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50">
                          {skill}
                        </Badge>
                      ))}
                      {resume.skills.length > 3 && (
                        <Badge variant="outline" className="bg-blue-50">
                          +{resume.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 flex justify-center">
                    <Link href={`/talent/${resume.id}`}>
                      <Button className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Post a resume CTA for applicants */}
          {user?.userType === "applicant" && (
            <div className="mt-12 bg-primary rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Showcase your skills to project owners</h2>
              <p className="mb-6 text-blue-100">
                Create a compelling resume to get noticed by startups and project creators.
              </p>
              <Link href="/create-resume">
                <Button variant="secondary" size="lg">
                  Create Your Resume
                </Button>
              </Link>
            </div>
          )}
          
          {/* Create account CTA for non-logged in users */}
          {!user && (
            <div className="mt-12 bg-primary rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Looking for talent for your project?</h2>
              <p className="mb-6 text-blue-100">
                Create an account to connect with students and early-career professionals.
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
