import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createRoute } from "@tanstack/react-router"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  disableTaxonomy,
  enableTaxonomy,
  listTaxonomies,
  updateTaxonomies,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/taxonomies",
  component: TaxonomiesIndexPage,
})

function TaxonomiesIndexPage() {
  const queryClient = useQueryClient()
  const taxonomiesQuery = useQuery({
    queryKey: ["taxonomies"],
    queryFn: listTaxonomies,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? disableTaxonomy(id) : enableTaxonomy(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["taxonomies"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTaxonomies,
    onSuccess: async () => {
      toast.success("Taxonomies updated")
      await queryClient.invalidateQueries({ queryKey: ["taxonomies"] })
    },
  })

  if (taxonomiesQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (taxonomiesQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load taxonomies</AlertTitle>
        <AlertDescription>
          {taxonomiesQuery.error instanceof Error
            ? taxonomiesQuery.error.message
            : "MISP did not return taxonomies."}
        </AlertDescription>
      </Alert>
    )
  }

  const taxonomies = taxonomiesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxonomies</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Update Taxonomies
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Namespace</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Active Tags</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxonomies.map((taxonomy) => (
              <TableRow key={taxonomy.Taxonomy.id}>
                <TableCell>{taxonomy.Taxonomy.id}</TableCell>
                <TableCell>{taxonomy.Taxonomy.namespace}</TableCell>
                <TableCell>{taxonomy.Taxonomy.version}</TableCell>
                <TableCell>
                  {taxonomy.Taxonomy.enabled ? "Yes" : "No"}
                </TableCell>
                <TableCell>
                  {taxonomy.current_count ?? 0} / {taxonomy.total_count ?? 0}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/taxonomies/view/$taxonomyId"
                      params={{ taxonomyId: taxonomy.Taxonomy.id }}
                    >
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleMutation.mutate({
                        id: taxonomy.Taxonomy.id,
                        enabled: Boolean(taxonomy.Taxonomy.enabled),
                      })
                    }
                    disabled={toggleMutation.isPending}
                  >
                    {taxonomy.Taxonomy.enabled ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
