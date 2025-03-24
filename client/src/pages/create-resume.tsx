import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertResumeSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, X, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extend the education schema
const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Extend the experience schema
const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Extend the resume schema for form validation
const resumeFormSchema = insertResumeSchema.extend({
  newSkill: z.string().optional(),
  newTalent: z.string().optional(),
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  skills: z.array(z.string()),
  talents: z.array(z.string()),
}).omit({ userId: true });

type ResumeFormValues = z.infer<typeof resumeFormSchema>;

// Field of study directions
const studyDirections = [
  "Computer Science",
  "Information Technology",
  "Graphic Design",
  "UX/UI Design",
  "Business Administration",
  "Marketing",
  "Finance",
  "Education",
  "Engineering",
  "Arts",
  "Event Management",
  "Health Sciences",
  "Other"
];

export default function CreateResume() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingTalent, setIsAddingTalent] = useState(false);
  
  // Initialize form with default values
  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      title: "",
      education: [{ 
        institution: "", 
        degree: "", 
        fieldOfStudy: "", 
        startDate: "", 
        endDate: "",
        description: ""
      }],
      experience: [],
      skills: [],
      direction: "",
      talents: [],
      newSkill: "",
      newTalent: "",
    },
  });
  
  // Set up field arrays
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = 
    useFieldArray({ control: form.control, name: "skills" });
  
  const { fields: talentFields, append: appendTalent, remove: removeTalent } = 
    useFieldArray({ control: form.control, name: "talents" });
    
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = 
    useFieldArray({ control: form.control, name: "education" });
    
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = 
    useFieldArray({ control: form.control, name: "experience" });
  
  // Add a new skill
  const handleAddSkill = () => {
    const newSkill = form.getValues("newSkill");
    if (newSkill) {
      appendSkill(newSkill);
      form.setValue("newSkill", "");
      setIsAddingSkill(false);
    }
  };
  
  // Add a new talent
  const handleAddTalent = () => {
    const newTalent = form.getValues("newTalent");
    if (newTalent) {
      appendTalent(newTalent);
      form.setValue("newTalent", "");
      setIsAddingTalent(false);
    }
  };
  
  // Create resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async (data: Omit<ResumeFormValues, "newSkill" | "newTalent">) => {
      // Add user ID to the data
      const resumeData = {
        ...data,
        userId: user!.id,
      };
      const res = await apiRequest("POST", "/api/resumes", resumeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resumes?userId=${user?.id}`] });
      toast({
        title: "Resume created successfully",
        description: "Your resume has been created and is now visible to project owners.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create resume",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ResumeFormValues) => {
    // Remove the temporary fields used for adding new items
    const { newSkill, newTalent, ...resumeData } = values;
    createResumeMutation.mutate(resumeData);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Your Resume</h1>
            <p className="mt-1 text-gray-600">
              Build a comprehensive resume to showcase your skills and experience to project owners.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Resume Details</CardTitle>
              <CardDescription>
                Provide information about your education, skills, and experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resume Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Full Stack Developer, UX Designer, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear title helps project owners understand your focus.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field/Direction of Study</FormLabel>
                        <FormControl>
                          <Input
                            list="study-directions"
                            placeholder="e.g., Computer Science, Graphic Design, etc."
                            {...field}
                          />
                        </FormControl>
                        <datalist id="study-directions">
                          {studyDirections.map((direction) => (
                            <option key={direction} value={direction} />
                          ))}
                        </datalist>
                        <FormDescription>
                          Your main field of study or expertise.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Education Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base font-medium">Education</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendEducation({ 
                          institution: "", 
                          degree: "", 
                          fieldOfStudy: "", 
                          startDate: "", 
                          endDate: "",
                          description: ""
                        })}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Education
                      </Button>
                    </div>
                    
                    {educationFields.map((field, index) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <FormLabel className="text-base font-medium">Education #{index + 1}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(index)}
                              disabled={educationFields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.institution`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Institution</FormLabel>
                                  <FormControl>
                                    <Input placeholder="University/School Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Degree</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Bachelor's, Master's" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`education.${index}.fieldOfStudy`}
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel>Field of Study</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Computer Science" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 09/2018" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.endDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date (or expected)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 06/2022 or Present" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`education.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Relevant coursework, achievements, etc."
                                    className="resize-y"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Experience Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base font-medium">Experience (Optional)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendExperience({ 
                          company: "", 
                          position: "", 
                          startDate: "", 
                          endDate: "",
                          description: ""
                        })}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Experience
                      </Button>
                    </div>
                    
                    {experienceFields.map((field, index) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <FormLabel className="text-base font-medium">Experience #{index + 1}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperience(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.company`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company/Organization</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Company Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`experience.${index}.position`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Position</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Intern, Developer" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 06/2021" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`experience.${index}.endDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 08/2021 or Present" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`experience.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe your responsibilities and achievements"
                                    className="resize-y"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Skills Section */}
                  <div>
                    <FormLabel className="text-base font-medium">Skills</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {skillFields.map((field, index) => (
                        <Badge key={field.id} className="py-1 px-3 gap-2">
                          {field.value}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0"
                            onClick={() => removeSkill(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      
                      {!isAddingSkill && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingSkill(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Skill
                        </Button>
                      )}
                    </div>
                    
                    {isAddingSkill && (
                      <div className="flex gap-2 mb-4">
                        <FormField
                          control={form.control}
                          name="newSkill"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="e.g., JavaScript, Photoshop, Project Management"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddSkill();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddSkill}>
                          Add
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingSkill(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      List your technical and professional skills.
                    </FormDescription>
                  </div>
                  
                  {/* Talents Section */}
                  <div>
                    <FormLabel className="text-base font-medium">Special Talents (Optional)</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {talentFields.map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="py-1 px-3 gap-2">
                          {field.value}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0"
                            onClick={() => removeTalent(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      
                      {!isAddingTalent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingTalent(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Talent
                        </Button>
                      )}
                    </div>
                    
                    {isAddingTalent && (
                      <div className="flex gap-2 mb-4">
                        <FormField
                          control={form.control}
                          name="newTalent"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="e.g., Public Speaking, Creative Writing, Photography"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddTalent();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddTalent}>
                          Add
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingTalent(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Highlight your special abilities that set you apart.
                    </FormDescription>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createResumeMutation.isPending}
                    >
                      {createResumeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Resume"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
