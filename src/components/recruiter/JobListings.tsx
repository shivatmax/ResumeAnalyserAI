import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const JobListings = () => {
  const { data: postedJobs, isLoading } = useQuery({
    queryKey: ["recruiter-jobs"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase
        .from("jobs")
        .select("*, applications(*)")
        .eq("recruiter_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {postedJobs?.map((job) => (
        <Card key={job.id} className="p-6">
          <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
          <p className="text-gray-600 mb-2">{job.company_name}</p>
          <p className="text-sm mb-2">{job.location}</p>
          <p className="text-sm mb-4">{job.employment_type}</p>
          <p className="text-sm mb-2">
            Applications: {job.applications?.length || 0}
          </p>
          {job.skills && job.skills.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Required Skills:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {job.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};