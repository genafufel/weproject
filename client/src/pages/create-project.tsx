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
import { insertProjectSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define fields available for projects
const projectFields = [
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

// Extend the project schema for form validation
const projectFormSchema = insertProjectSchema.extend({
  newPosition: z.string().optional(),
  newRequirement: z.string().optional(),
}).omit({ userId: true });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function CreateProject() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  
  // Initialize form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      field: "",
      positions: [],
      requirements: [],
      location: "",
      remote: false,
      newPosition: "",
      newRequirement: "",
    },
  });
  
  // Set up field arrays for positions and requirements
  const { fields: positionFields, append: appendPosition, remove: removePosition } = 
    useFieldArray({ control: form.control, name: "positions" });
  
  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = 
    useFieldArray({ control: form.control, name: "requirements" });
  
  // Add a new position
  const handleAddPosition = () => {
    const newPosition = form.getValues("newPosition");
    if (newPosition) {
      appendPosition(newPosition);
      form.setValue("newPosition", "");
      setIsAddingPosition(false);
    }
  };
  
  // Add a new requirement
  const handleAddRequirement = () => {
    const newRequirement = form.getValues("newRequirement");
    if (newRequirement) {
      appendRequirement(newRequirement);
      form.setValue("newRequirement", "");
      setIsAddingRequirement(false);
    }
  };
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: Omit<ProjectFormValues, "newPosition" | "newRequirement">) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects?userId=${user?.id}`] });
      toast({
        title: "Project created successfully",
        description: "Your project has been created and is now visible to applicants.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ProjectFormValues) => {
    // Remove the temporary fields used for adding new items
    const { newPosition, newRequirement, ...projectData } = values;
    createProjectMutation.mutate(projectData);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create a New Project</h1>
            <p className="mt-1 text-gray-600">
              Post your project and find talented students to help you bring it to life.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Provide details about your project to attract the right candidates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a clear, descriptive title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Make your title specific and attention-grabbing.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Field</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select the field of your project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectFields.map((projectField) => (
                              <SelectItem key={projectField.value} value={projectField.value}>
                                {projectField.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the field that best represents your project.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your project in detail"
                            className="min-h-32 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include project goals, timeline, and what you're looking to achieve.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Required Positions</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {positionFields.map((field, index) => (
                        <Badge key={field.id} className="py-1 px-3 gap-2">
                          {field.value}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0"
                            onClick={() => removePosition(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      
                      {!isAddingPosition && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingPosition(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Position
                        </Button>
                      )}
                    </div>
                    
                    {isAddingPosition && (
                      <div className="flex gap-2 mb-4">
                        <FormField
                          control={form.control}
                          name="newPosition"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="e.g., React Developer, UX/UI Designer"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddPosition();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddPosition}>
                          Add
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingPosition(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      List the roles you need for this project.
                    </FormDescription>
                  </div>
                  
                  <div>
                    <FormLabel>Requirements</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {requirementFields.map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="py-1 px-3 gap-2">
                          {field.value}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0"
                            onClick={() => removeRequirement(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      
                      {!isAddingRequirement && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingRequirement(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Requirement
                        </Button>
                      )}
                    </div>
                    
                    {isAddingRequirement && (
                      <div className="flex gap-2 mb-4">
                        <FormField
                          control={form.control}
                          name="newRequirement"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="e.g., JavaScript knowledge, Design skills"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddRequirement();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddRequirement}>
                          Add
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingRequirement(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Specify the skills and qualifications required.
                    </FormDescription>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., New York, NY" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank if location is flexible.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="remote"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Remote Work</FormLabel>
                            <FormDescription>
                              Is this project open to remote collaboration?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
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
                      disabled={createProjectMutation.isPending}
                    >
                      {createProjectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Project"
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
