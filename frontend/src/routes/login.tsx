import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { createRoute, redirect, useNavigate } from "@tanstack/react-router"
import { AlertCircleIcon, LockKeyholeIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import { loginWithSession } from "@/lib/misp"
import { Route as rootRoute, currentUserQueryOptions } from "@/routes/__root"

type LoginSearch = {
  redirect?: string
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect:
      typeof search.redirect === "string" && search.redirect.startsWith("/")
        ? search.redirect
        : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    try {
      await context.queryClient.ensureQueryData(currentUserQueryOptions())
      throw redirect({ to: search.redirect || "/" })
    } catch (error) {
      if (error && typeof error === "object" && "to" in error) {
        throw error
      }
    }
  },
  component: LoginPage,
})

function getFieldError(field: { state: { meta: { errors: Array<unknown> } } }) {
  const firstError = field.state.meta.errors[0]
  return typeof firstError === "string" ? firstError : undefined
}

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = Route.useSearch()

  const loginMutation = useMutation({
    mutationFn: loginWithSession,
    onSuccess: async (user) => {
      queryClient.setQueryData(["auth", "current-user"], user)
      await navigate({ to: search.redirect || "/" })
    },
  })

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value)
    },
  })

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <LockKeyholeIcon />
            MISP Session Login
          </div>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in with the same credentials used in the legacy MISP UI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              {loginMutation.isError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Login failed</AlertTitle>
                  <AlertDescription>
                    {loginMutation.error instanceof Error
                      ? loginMutation.error.message
                      : "MISP rejected the login request."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() ? undefined : "Email is required.",
                }}
              >
                {(field) => {
                  const error = getFieldError(field)
                  return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        autoComplete="username"
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
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) =>
                    value ? undefined : "Password is required.",
                }}
              >
                {(field) => {
                  const error = getFieldError(field)
                  return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        autoComplete="current-password"
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
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={
                      !canSubmit || isSubmitting || loginMutation.isPending
                    }
                  >
                    Login
                  </Button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
