import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createRoute } from "@tanstack/react-router"
import { RefreshCwIcon } from "lucide-react"
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
import {
  disableTaxonomy,
  enableTaxonomy,
  getTaxonomy,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/taxonomies/view/$taxonomyId",
  component: TaxonomyViewPage,
})

function TaxonomyViewPage() {
  const { taxonomyId } = Route.useParams()
  const queryClient = useQueryClient()
  const taxonomyQuery = useQuery({
    queryKey: ["taxonomy", taxonomyId],
    queryFn: () => getTaxonomy(taxonomyId),
  })

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      enabled ? disableTaxonomy(taxonomyId) : enableTaxonomy(taxonomyId),
    onSuccess: async () => {
      toast.success("Taxonomy updated")
      await queryClient.invalidateQueries({ queryKey: ["taxonomy", taxonomyId] })
      await queryClient.invalidateQueries({ queryKey: ["taxonomies"] })
    },
  })

  if (taxonomyQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (taxonomyQuery.isError || !taxonomyQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load taxonomy</AlertTitle>
        <AlertDescription>
          {taxonomyQuery.error instanceof Error
            ? taxonomyQuery.error.message
            : "MISP did not return the taxonomy."}
        </AlertDescription>
      </Alert>
    )
  }

  const taxonomy = taxonomyQuery.data

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{taxonomy.Taxonomy.namespace}</CardTitle>
          <CardDescription>{taxonomy.Taxonomy.description}</CardDescription>
          <CardAction className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/taxonomies">Back to taxonomies</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleMutation.mutate(Boolean(taxonomy.Taxonomy.enabled))}
            >
              {taxonomy.Taxonomy.enabled ? "Disable" : "Enable"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <MetaItem label="ID" value={taxonomy.Taxonomy.id} />
          <MetaItem label="Version" value={taxonomy.Taxonomy.version} />
          <MetaItem
            label="Enabled"
            value={taxonomy.Taxonomy.enabled ? "Yes" : "No"}
          />
          <MetaItem
            label="Required"
            value={taxonomy.Taxonomy.required ? "Yes" : "No"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(taxonomy.entries ?? []).slice(0, 50).map((entry) => (
            <div key={entry.tag} className="border border-border px-3 py-2 text-sm">
              <div className="font-medium">{entry.tag}</div>
              <div className="text-muted-foreground">
                {entry.expanded || entry.description || ""}
              </div>
            </div>
          ))}
          {(taxonomy.entries?.length ?? 0) > 50 ? (
            <Alert>
              <RefreshCwIcon />
              <AlertTitle>Entry list truncated</AlertTitle>
              <AlertDescription>
                Showing the first 50 taxonomy entries in this frontend pass.
              </AlertDescription>
            </Alert>
          ) : null}
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
