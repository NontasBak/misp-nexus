import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, createRoute, useNavigate } from "@tanstack/react-router"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  addAttribute,
  analysisLabels,
  attributeCategories,
  commonAttributeTypes,
  deleteEvent,
  distributionLabels,
  getEvent,
  threatLevelLabels,
  type AttributeFormInput,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events/view/$eventId",
  component: EventViewPage,
})

const defaultAttributeValues: AttributeFormInput = {
  category: "Network activity",
  type: "ip-src",
  value: "",
  to_ids: true,
  comment: "",
}

function getFieldError(field: { state: { meta: { errors: Array<unknown> } } }) {
  const firstError = field.state.meta.errors[0]
  return typeof firstError === "string" ? firstError : undefined
}

function EventViewPage() {
  const { eventId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId),
    onSuccess: async () => {
      toast.success("Event deleted")
      await queryClient.invalidateQueries({ queryKey: ["events"] })
      await navigate({ to: "/" })
    },
  })

  const addAttributeMutation = useMutation({
    mutationFn: (values: AttributeFormInput) => addAttribute(eventId, values),
    onSuccess: async () => {
      toast.success("Attribute added")
      await queryClient.invalidateQueries({ queryKey: ["event", eventId] })
      await queryClient.invalidateQueries({ queryKey: ["attributes"] })
    },
  })

  const attributeForm = useForm({
    defaultValues: defaultAttributeValues,
    onSubmit: async ({ value, formApi }) => {
      await addAttributeMutation.mutateAsync(value)
      formApi.reset()
    },
  })

  if (eventQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load event</AlertTitle>
        <AlertDescription>
          {eventQuery.error instanceof Error
            ? eventQuery.error.message
            : "MISP did not return the event."}
        </AlertDescription>
      </Alert>
    )
  }

  const event = eventQuery.data.Event
  const attributes = event.Attribute ?? []
  const objects = event.Object ?? []

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Event {event.id}</CardTitle>
          <CardDescription>{event.info}</CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/misp/events/view/${event.id}`}>Legacy View</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/events/edit/$eventId" params={{ eventId }}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm(`Delete event ${event.id}?`)) {
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
        <CardContent className="grid gap-3 md:grid-cols-4">
          <MetaItem label="Date" value={event.date ?? "-"} />
          <MetaItem
            label="Threat"
            value={threatLevelLabels[event.threat_level_id ?? ""] ?? "-"}
          />
          <MetaItem
            label="Analysis"
            value={analysisLabels[event.analysis ?? ""] ?? "-"}
          />
          <MetaItem
            label="Distribution"
            value={distributionLabels[event.distribution ?? ""] ?? "-"}
          />
          <MetaItem label="Owner Org" value={event.Orgc?.name ?? "-"} />
          <MetaItem label="Published" value={event.published ? "Yes" : "No"} />
          <MetaItem label="Attributes" value={String(attributes.length)} />
          <MetaItem label="Objects" value={String(objects.length)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
          <CardDescription>
            Basic attribute CRUD is available from this event.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              attributeForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <attributeForm.Field
                  name="category"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {attributeCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <attributeForm.Field
                  name="type"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {commonAttributeTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
              <attributeForm.Field
                name="value"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() ? undefined : "Value is required.",
                }}
              >
                {(field) => {
                  const error = getFieldError(field)
                  return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor={field.name}>Value</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={Boolean(error)}
                      />
                      <FieldError>{error}</FieldError>
                    </Field>
                  )
                }}
              </attributeForm.Field>
              <attributeForm.Field
                name="comment"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Comment</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </Field>
                )}
              />
              <div className="flex items-center gap-2">
                <attributeForm.Field
                  name="to_ids"
                  children={(field) => (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.checked)
                        }
                      />
                      To IDS
                    </label>
                  )}
                />
                <attributeForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={
                        !canSubmit ||
                        isSubmitting ||
                        addAttributeMutation.isPending
                      }
                    >
                      <PlusIcon data-icon="inline-start" />
                      Add Attribute
                    </Button>
                  )}
                </attributeForm.Subscribe>
              </div>
            </FieldGroup>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>IDS</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No attributes attached to this event.
                  </TableCell>
                </TableRow>
              ) : (
                attributes.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell>{attribute.id}</TableCell>
                    <TableCell>{attribute.category}</TableCell>
                    <TableCell>{attribute.type}</TableCell>
                    <TableCell className="max-w-xl truncate">
                      {attribute.value}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={attribute.to_ids ? "default" : "secondary"}
                      >
                        {attribute.to_ids ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to="/attributes/view/$attributeId"
                          params={{ attributeId: attribute.id }}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objects</CardTitle>
          <CardDescription>
            Object creation and editing are template-driven in MISP.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/misp/objects/add/${event.id}`}>Legacy Add Object</a>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <AlertTitle>Template picker pending</AlertTitle>
            <AlertDescription>
              The frontend object builder still needs template selection and
              template-aware editors. List, view and delete are available.
            </AlertDescription>
          </Alert>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Meta-category</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {objects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No objects attached to this event.
                  </TableCell>
                </TableRow>
              ) : (
                objects.map((object) => (
                  <TableRow key={object.id}>
                    <TableCell>{object.id}</TableCell>
                    <TableCell>{object.name ?? "-"}</TableCell>
                    <TableCell>{object["meta-category"] ?? "-"}</TableCell>
                    <TableCell>{object.Attribute?.length ?? 0}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to="/objects/view/$objectId"
                          params={{ objectId: object.id }}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
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
      <div className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div>{value}</div>
    </div>
  )
}
