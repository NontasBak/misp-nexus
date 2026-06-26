import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, createRoute, useNavigate } from "@tanstack/react-router"
import { AlertCircleIcon, SaveIcon } from "lucide-react"
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
  FieldDescription,
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
  analysisLabels,
  distributionLabels,
  editEvent,
  getEvent,
  threatLevelLabels,
  type AddEventInput,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events/edit/$eventId",
  component: EventEditPage,
})

function getFieldError(field: { state: { meta: { errors: Array<unknown> } } }) {
  const firstError = field.state.meta.errors[0]
  return typeof firstError === "string" ? firstError : undefined
}

function EventEditPage() {
  const { eventId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
  })

  const editMutation = useMutation({
    mutationFn: (values: AddEventInput) => editEvent(eventId, values),
    onSuccess: async () => {
      toast.success("Event updated")
      await queryClient.invalidateQueries({ queryKey: ["event", eventId] })
      await queryClient.invalidateQueries({ queryKey: ["events"] })
      await navigate({ to: "/events/view/$eventId", params: { eventId } })
    },
  })

  if (eventQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />
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

  return (
    <EventEditForm
      event={eventQuery.data.Event}
      eventId={eventId}
      isPending={editMutation.isPending}
      error={editMutation.error}
      onSubmit={(values) => editMutation.mutateAsync(values)}
    />
  )
}

function EventEditForm({
  event,
  eventId,
  isPending,
  error,
  onSubmit,
}: {
  event: Awaited<ReturnType<typeof getEvent>>["Event"]
  eventId: string
  isPending: boolean
  error: unknown
  onSubmit: (values: AddEventInput) => Promise<unknown>
}) {
  const form = useForm({
    defaultValues: {
      info: event.info ?? "",
      date: event.date ?? "",
      distribution: event.distribution ?? "1",
      threat_level_id: event.threat_level_id ?? "4",
      analysis: event.analysis ?? "0",
      sharing_group_id: event.sharing_group_id ?? "",
    } satisfies AddEventInput,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Event {event.id}</CardTitle>
        <CardDescription>Update core event metadata.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/events/view/$eventId" params={{ eventId }}>
              Back to event
            </Link>
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
            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Unable to update event</AlertTitle>
                <AlertDescription>
                  {error instanceof Error
                    ? error.message
                    : "MISP rejected the event update."}
                </AlertDescription>
              </Alert>
            ) : null}

            <form.Field
              name="info"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Event info is required.",
              }}
            >
              {(field) => {
                const fieldError = getFieldError(field)
                return (
                  <Field data-invalid={Boolean(fieldError)}>
                    <FieldLabel htmlFor={field.name}>Info</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={Boolean(fieldError)}
                    />
                    <FieldDescription>
                      Mirrors the legacy event edit form.
                    </FieldDescription>
                    <FieldError>{fieldError}</FieldError>
                  </Field>
                )
              }}
            </form.Field>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="date">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="threat_level_id">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Threat Level</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(threatLevelLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="analysis">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Analysis</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(analysisLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="distribution">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Distribution</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(distributionLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="sharing_group_id">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Sharing Group ID</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                >
                  <SaveIcon data-icon="inline-start" />
                  {isPending ? "Saving..." : "Save Event"}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
