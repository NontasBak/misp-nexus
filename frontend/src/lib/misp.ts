export type MispOrg = {
  id?: string
  name?: string
  uuid?: string
}

export type MispCurrentUser = {
  User: {
    id: string
    email: string
    org_id?: string
    role_id?: string
    disabled?: boolean
    [key: string]: unknown
  }
  Role?: Record<string, unknown>
  Organisation?: MispOrg
  UserSetting?: unknown
  Server?: Record<string, unknown>
}

export type MispEventIndexItem = {
  id: string
  org_id?: string
  date?: string
  info?: string
  uuid?: string
  published?: boolean | string | number
  analysis?: string
  attribute_count?: string
  orgc_id?: string
  timestamp?: string
  distribution?: string
  sharing_group_id?: string
  locked?: boolean
  threat_level_id?: string
  publish_timestamp?: string
  Org?: MispOrg
  Orgc?: MispOrg
  EventTag?: Array<{
    Tag?: {
      id?: string
      name?: string
      colour?: string
    }
  }>
}

export type EventIndexFilters = {
  eventinfo?: string
  published?: string
  org?: string
  tag?: string
}

export type AddEventInput = {
  info: string
  date: string
  distribution: string
  threat_level_id: string
  analysis: string
  sharing_group_id: string
}

type ApiErrorBody = {
  name?: string
  message?: string
  errors?: unknown
}

export class MispAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MispAuthError"
    this.status = status
  }
}

const apiBase = "/misp"

export const threatLevelLabels: Record<string, string> = {
  "1": "High",
  "2": "Medium",
  "3": "Low",
  "4": "Undefined",
}

export const analysisLabels: Record<string, string> = {
  "0": "Initial",
  "1": "Ongoing",
  "2": "Completed",
}

export const distributionLabels: Record<string, string> = {
  "0": "Your organisation only",
  "1": "This community only",
  "2": "Connected communities",
  "3": "All communities",
  "4": "Sharing group",
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const body = text ? (JSON.parse(text) as ApiErrorBody | T) : undefined

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined
    const detail =
      errorBody?.message ||
      errorBody?.name ||
      `MISP returned ${response.status} ${response.statusText}`
    if (response.status === 401 || response.status === 403) {
      throw new MispAuthError(detail, response.status)
    }
    throw new Error(detail)
  }

  return body as T
}

function parseLoginTokenFields(html: string) {
  const parser = new DOMParser()
  const document = parser.parseFromString(html, "text/html")
  const form = document.querySelector<HTMLFormElement>("form#UserLoginForm")

  if (!form) {
    throw new Error("Could not load the MISP login form.")
  }

  const tokenKey = form.querySelector<HTMLInputElement>(
    'input[name="data[_Token][key]"]'
  )?.value
  const tokenFields = form.querySelector<HTMLInputElement>(
    'input[name="data[_Token][fields]"]'
  )?.value
  const tokenUnlocked = form.querySelector<HTMLInputElement>(
    'input[name="data[_Token][unlocked]"]'
  )?.value

  if (!tokenKey || !tokenFields || tokenUnlocked === undefined) {
    throw new Error("The MISP login form is missing CSRF token fields.")
  }

  return {
    action: form.getAttribute("action") || `${apiBase}/users/login`,
    tokenKey,
    tokenFields,
    tokenUnlocked,
  }
}

export async function getCurrentUser() {
  const response = await fetch(`${apiBase}/users/view/me`, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  })

  return parseResponse<MispCurrentUser>(response)
}

export async function loginWithSession(credentials: {
  email: string
  password: string
}) {
  const loginPageResponse = await fetch(`${apiBase}/users/login`, {
    credentials: "same-origin",
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  })

  const loginPageHtml = await loginPageResponse.text()
  const tokenFields = parseLoginTokenFields(loginPageHtml)
  const body = new URLSearchParams()

  body.set("data[_Token][key]", tokenFields.tokenKey)
  body.set("data[_Token][fields]", tokenFields.tokenFields)
  body.set("data[_Token][unlocked]", tokenFields.tokenUnlocked)
  body.set("data[User][email]", credentials.email.trim())
  body.set("data[User][password]", credentials.password)

  try {
    await fetch(tokenFields.action, {
      method: "POST",
      credentials: "same-origin",
      redirect: "error",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
    })
  } catch {
    // MISP responds to successful login with a redirect to the legacy UI.
    // We intentionally stop the redirect chain here and validate the session
    // with a JSON request below.
  }

  try {
    return await getCurrentUser()
  } catch (error) {
    if (error instanceof MispAuthError) {
      throw new Error("Invalid username or password.", { cause: error })
    }
    throw error
  }
}

export async function logoutSession() {
  try {
    await fetch(`${apiBase}/users/logout`, {
      credentials: "same-origin",
      redirect: "error",
    })
  } catch {
    // Successful logout also redirects to the legacy login page.
  }
}

export async function listEvents(filters: EventIndexFilters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const response = await fetch(
    `${apiBase}/events/index${params.size ? `?${params}` : ""}`,
    {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    }
  )

  const events = await parseResponse<MispEventIndexItem[]>(response)
  const count = Number(response.headers.get("X-Result-Count") ?? events.length)

  return { events, count }
}

export async function addEvent(values: AddEventInput) {
  const event: Record<string, string> = {
    info: values.info.trim(),
    date: values.date,
    distribution: values.distribution,
    threat_level_id: values.threat_level_id,
    analysis: values.analysis,
  }

  if (values.distribution === "4" && values.sharing_group_id.trim()) {
    event.sharing_group_id = values.sharing_group_id.trim()
  }

  const response = await fetch(`${apiBase}/events/add`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Event: event }),
  })

  return parseResponse<{ Event?: MispEventIndexItem } & MispEventIndexItem>(
    response
  )
}
