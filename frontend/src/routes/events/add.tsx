import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Textarea } from "@/components/ui/textarea"
import {
  addEvent,
  analysisLabels,
  distributionLabels,
  threatLevelLabels,
  type AddEventInput,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events/add",
  component: AddEventPage,
})

const today = new Date().toISOString().slice(0, 10)

function getFieldError(field: { state: { meta: { errors: Array<unknown> } } }) {
  const firstError = field.state.meta.errors[0]
  return typeof firstError === "string" ? firstError : undefined
}

function AddEventPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const addEventMutation = useMutation({
    mutationFn: addEvent,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["events"] })
      const createdId = result.Event?.id ?? result.id
      toast.success("Event created")

      if (createdId) {
        await navigate({
          to: "/events/view/$eventId",
          params: { eventId: createdId },
        })
      } else {
        navigate({ to: "/" })
      }
    },
  })

  const form = useForm({
    defaultValues: {
      info: "",
      date: today,
      distribution: "1",
      threat_level_id: "4",
      analysis: "0",
      sharing_group_id: "",
    } satisfies AddEventInput,
    onSubmit: async ({ value }) => {
      await addEventMutation.mutateAsync(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Event</CardTitle>
        <CardDescription>Create a new MISP event.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Back to events</Link>
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
            {addEventMutation.isError ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Unable to create event</AlertTitle>
                <AlertDescription>
                  {addEventMutation.error instanceof Error
                    ? addEventMutation.error.message
                    : "MISP rejected the event."}
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
                const error = getFieldError(field)
                return (
                  <Field data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor={field.name}>Info</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={Boolean(error)}
                      placeholder="Short event description"
                    />
                    <FieldDescription>
                      This is the only required field in MISP.
                    </FieldDescription>
                    <FieldError>{error}</FieldError>
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
                      name={field.name}
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
                    name={field.name}
                    inputMode="numeric"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Required when distribution is Sharing group"
                  />
                </Field>
              )}
            </form.Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/">Cancel</Link>
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={
                      !canSubmit || isSubmitting || addEventMutation.isPending
                    }
                  >
                    <SaveIcon data-icon="inline-start" />
                    {addEventMutation.isPending ? "Saving" : "Save"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
