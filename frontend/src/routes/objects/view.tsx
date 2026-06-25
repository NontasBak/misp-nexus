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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteObject, getObject } from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/objects/view/$objectId",
  component: ObjectViewPage,
})

function ObjectViewPage() {
  const { objectId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const objectQuery = useQuery({
    queryKey: ["object", objectId],
    queryFn: () => getObject(objectId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteObject(objectId),
    onSuccess: async () => {
      toast.success("Object deleted")
      await queryClient.invalidateQueries({ queryKey: ["objects"] })
      await navigate({ to: "/" })
    },
  })

  if (objectQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (objectQuery.isError || !objectQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load object</AlertTitle>
        <AlertDescription>
          {objectQuery.error instanceof Error
            ? objectQuery.error.message
            : "MISP did not return the object."}
        </AlertDescription>
      </Alert>
    )
  }

  const object = objectQuery.data.Object
  const attributes = objectQuery.data.Attribute ?? object.Attribute ?? []

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Object {object.id}</CardTitle>
          <CardDescription>
            {object.name ?? "Unnamed object"} in event {object.event_id}
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/events/view/$eventId" params={{ eventId: object.event_id }}>
                Back to event
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/misp/objects/edit/${object.id}`}>Legacy Edit</a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm(`Delete object ${object.id}?`)) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <MetaItem label="Name" value={object.name ?? "-"} />
          <MetaItem label="Meta-category" value={object["meta-category"] ?? "-"} />
          <MetaItem label="Attributes" value={String(attributes.length)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Object Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No attributes in this object.
                  </TableCell>
                </TableRow>
              ) : (
                attributes.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell>{attribute.id}</TableCell>
                    <TableCell>{attribute.object_relation ?? "-"}</TableCell>
                    <TableCell>{attribute.type}</TableCell>
                    <TableCell>{attribute.value}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
