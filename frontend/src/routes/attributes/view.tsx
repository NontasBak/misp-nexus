import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
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
import { Textarea } from "@/components/ui/textarea"
import {
  attributeCategories,
  commonAttributeTypes,
  deleteAttribute,
  editAttribute,
  getAttribute,
  type AttributeFormInput,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attributes/view/$attributeId",
  component: AttributeViewPage,
})

function getFieldError(field: { state: { meta: { errors: Array<unknown> } } }) {
  const firstError = field.state.meta.errors[0]
  return typeof firstError === "string" ? firstError : undefined
}

function AttributeViewPage() {
  const { attributeId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const attributeQuery = useQuery({
    queryKey: ["attribute", attributeId],
    queryFn: () => getAttribute(attributeId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAttribute(attributeId),
    onSuccess: async () => {
      toast.success("Attribute deleted")
      await queryClient.invalidateQueries({ queryKey: ["attributes"] })
      await navigate({ to: "/" })
    },
  })

  if (attributeQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />
  }

  if (attributeQuery.isError || !attributeQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load attribute</AlertTitle>
        <AlertDescription>
          {attributeQuery.error instanceof Error
            ? attributeQuery.error.message
            : "MISP did not return the attribute."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <AttributeEditor
      attribute={attributeQuery.data.Attribute}
      attributeId={attributeId}
      isDeleting={deleteMutation.isPending}
      onDelete={() => deleteMutation.mutate()}
      queryClient={queryClient}
    />
  )
}

function AttributeEditor({
  attribute,
  attributeId,
  isDeleting,
  onDelete,
  queryClient,
}: {
  attribute: Awaited<ReturnType<typeof getAttribute>>["Attribute"]
  attributeId: string
  isDeleting: boolean
  onDelete: () => void
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const form = useForm({
    defaultValues: {
      category: attribute.category,
      type: attribute.type,
      value: attribute.value,
      to_ids: Boolean(attribute.to_ids),
      comment: attribute.comment ?? "",
    } satisfies AttributeFormInput,
    onSubmit: async ({ value }) => {
      await editAttribute(attributeId, value)
      toast.success("Attribute updated")
      await queryClient.invalidateQueries({ queryKey: ["attribute", attributeId] })
      await queryClient.invalidateQueries({ queryKey: ["attributes"] })
      await queryClient.invalidateQueries({ queryKey: ["event", attribute.event_id] })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attribute {attribute.id}</CardTitle>
        <CardDescription>
          Event {attribute.event_id}
          {attribute.Event?.info ? ` - ${attribute.Event.info}` : ""}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/events/view/$eventId" params={{ eventId: attribute.event_id }}>
              Back to event
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm(`Delete attribute ${attribute.id}?`)) {
                onDelete()
              }
            }}
            disabled={isDeleting}
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form
          className="max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="category">
                {(field) => (
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
              </form.Field>

              <form.Field name="type">
                {(field) => (
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
              </form.Field>
            </div>

            <form.Field
              name="value"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Value is required.",
              }}
            >
              {(field) => {
                const fieldError = getFieldError(field)
                return (
                  <Field data-invalid={Boolean(fieldError)}>
                    <FieldLabel htmlFor={field.name}>Value</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={Boolean(fieldError)}
                    />
                    <FieldError>{fieldError}</FieldError>
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="comment">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Comment</FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="to_ids">
              {(field) => (
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
            </form.Field>

            <Button type="submit">Save Attribute</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
