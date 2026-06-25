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
import { listGalaxies, updateGalaxies } from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/galaxies",
  component: GalaxiesIndexPage,
})

function GalaxiesIndexPage() {
  const queryClient = useQueryClient()
  const galaxiesQuery = useQuery({
    queryKey: ["galaxies"],
    queryFn: listGalaxies,
  })

  const updateMutation = useMutation({
    mutationFn: updateGalaxies,
    onSuccess: async () => {
      toast.success("Galaxies updated")
      await queryClient.invalidateQueries({ queryKey: ["galaxies"] })
    },
  })

  if (galaxiesQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (galaxiesQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load galaxies</AlertTitle>
        <AlertDescription>
          {galaxiesQuery.error instanceof Error
            ? galaxiesQuery.error.message
            : "MISP did not return galaxies."}
        </AlertDescription>
      </Alert>
    )
  }

  const galaxies = galaxiesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galaxies</CardTitle>
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
            Update Galaxies
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {galaxies.map((galaxy) => (
              <TableRow key={galaxy.Galaxy.id}>
                <TableCell>{galaxy.Galaxy.id}</TableCell>
                <TableCell>{galaxy.Galaxy.name}</TableCell>
                <TableCell>{galaxy.Galaxy.type ?? "-"}</TableCell>
                <TableCell>{galaxy.Galaxy.version ?? "-"}</TableCell>
                <TableCell>{galaxy.Galaxy.enabled ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/galaxies/view/$galaxyId"
                      params={{ galaxyId: galaxy.Galaxy.id }}
                    >
                      View
                    </Link>
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
