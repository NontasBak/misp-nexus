import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createRoute, useNavigate } from "@tanstack/react-router"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteGalaxy, getGalaxy } from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/galaxies/view/$galaxyId",
  component: GalaxyViewPage,
})

function GalaxyViewPage() {
  const { galaxyId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const galaxyQuery = useQuery({
    queryKey: ["galaxy", galaxyId],
    queryFn: () => getGalaxy(galaxyId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteGalaxy(galaxyId),
    onSuccess: async () => {
      toast.success("Galaxy deleted")
      await queryClient.invalidateQueries({ queryKey: ["galaxies"] })
      await navigate({ to: "/galaxies" })
    },
  })

  if (galaxyQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (galaxyQuery.isError || !galaxyQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load galaxy</AlertTitle>
        <AlertDescription>
          {galaxyQuery.error instanceof Error
            ? galaxyQuery.error.message
            : "MISP did not return the galaxy."}
        </AlertDescription>
      </Alert>
    )
  }

  const galaxy = galaxyQuery.data

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{galaxy.Galaxy.name}</CardTitle>
          <CardDescription>{galaxy.Galaxy.description}</CardDescription>
          <CardAction className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/galaxies">Back to galaxies</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/misp/galaxies/view/${galaxy.Galaxy.id}`}>Legacy View</a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm(`Delete galaxy ${galaxy.Galaxy.id}?`)) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending || Boolean(galaxy.Galaxy.default)}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <MetaItem label="ID" value={galaxy.Galaxy.id} />
          <MetaItem label="Type" value={galaxy.Galaxy.type ?? "-"} />
          <MetaItem label="Version" value={galaxy.Galaxy.version ?? "-"} />
          <MetaItem
            label="Enabled"
            value={galaxy.Galaxy.enabled ? "Yes" : "No"}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Clusters</CardTitle>
          <CardDescription>
            Showing the first 25 clusters for this galaxy.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(galaxy.GalaxyCluster ?? []).slice(0, 25).map((cluster) => (
            <div key={cluster.id} className="border border-border px-3 py-2 text-sm">
              <div className="font-medium">{cluster.value}</div>
              <div className="text-muted-foreground">
                {cluster.description || cluster.tag_name || ""}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border border-border px-3 py-2 text-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{value}</div>
    </div>
  )
}
