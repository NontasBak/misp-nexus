export type MispOrg = {
  id?: string
  name?: string
  uuid?: string
  local?: boolean
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

export type MispAttribute = {
  id: string
  event_id: string
  category: string
  type: string
  value: string
  to_ids?: boolean
  comment?: string
  uuid?: string
  distribution?: string
  sharing_group_id?: string
  deleted?: boolean
  disable_correlation?: boolean
  first_seen?: string | null
  last_seen?: string | null
  timestamp?: string
  object_id?: string
  object_relation?: string | null
  Event?: Pick<MispEventIndexItem, "id" | "info" | "date">
}

export type MispObject = {
  id: string
  event_id: string
  name?: string
  "meta-category"?: string
  description?: string
  distribution?: string
  sharing_group_id?: string
  template_uuid?: string
  template_version?: string
  timestamp?: string
  deleted?: boolean
  Attribute?: MispAttribute[]
}

export type MispEvent = {
  Event: MispEventIndexItem & {
    Attribute?: MispAttribute[]
    Object?: MispObject[]
    Galaxy?: Array<Record<string, unknown>>
    EventReport?: Array<Record<string, unknown>>
    CryptographicKey?: Array<Record<string, unknown>>
  }
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

export type AttributeFormInput = {
  category: string
  type: string
  value: string
  to_ids: boolean
  comment: string
}

export type MispTaxonomyListItem = {
  Taxonomy: {
    id: string
    namespace: string
    description: string
    version: string
    enabled: boolean
    exclusive?: boolean
    required?: boolean
    highlighted?: boolean
  }
  total_count?: number
  current_count?: number
}

export type MispTaxonomy = {
  Taxonomy: MispTaxonomyListItem["Taxonomy"]
  entries?: Array<{
    tag: string
    expanded?: string
    description?: string
    colour?: string
    existing_tag?: {
      Tag?: {
        id?: string
        name?: string
        colour?: string
      }
    }
  }>
}

export type MispGalaxyListItem = {
  Galaxy: {
    id: string
    uuid?: string
    name: string
    type?: string
    description?: string
    version?: string
    icon?: string
    namespace?: string
    enabled?: boolean
    local_only?: boolean
    default?: boolean
    distribution?: string
  }
}

export type MispGalaxy = {
  Galaxy: MispGalaxyListItem["Galaxy"]
  Org?: MispOrg
  Orgc?: MispOrg
  GalaxyCluster?: Array<{
    id: string
    value: string
    tag_name?: string
    description?: string
    type?: string
    GalaxyElement?: Array<{
      key: string
      value: string
    }>
  }>
}

type ApiErrorBody = {
  name?: string
  message?: string
  errors?: unknown
}

type ToggleResponse = {
  saved?: boolean
  success?: boolean
  message?: string
  name?: string
  id?: string
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
  "5": "Inherited",
}

export const attributeCategories = [
  "Network activity",
  "Payload delivery",
  "Artifacts dropped",
  "Persistence mechanism",
  "Payload installation",
  "External analysis",
  "Financial fraud",
  "Support Tool",
] as const

export const commonAttributeTypes = [
  "ip-src",
  "ip-dst",
  "domain",
  "hostname",
  "url",
  "md5",
  "sha1",
  "sha256",
  "email-src",
  "email-dst",
] as const

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

async function fetchJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  })

  return parseResponse<T>(response)
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
  return fetchJson<MispCurrentUser>("/users/view/me")
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
    // A successful login redirects into the legacy UI.
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
    // A successful logout redirects into the legacy login page.
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

export async function getEvent(eventId: string) {
  return fetchJson<MispEvent>(`/events/view/${eventId}`)
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

  return fetchJson<{ Event?: MispEventIndexItem } & MispEventIndexItem>(
    "/events/add",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Event: event }),
    }
  )
}

export async function editEvent(eventId: string, values: AddEventInput) {
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

  return fetchJson<MispEvent>(`/events/edit/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Event: event }),
  })
}

export async function deleteEvent(eventId: string) {
  return fetchJson<ToggleResponse>(`/events/delete/${eventId}`, {
    method: "DELETE",
  })
}

export async function listAttributes(eventId?: string) {
  const payload: Record<string, string | number> = {
    returnFormat: "json",
    limit: 100,
    page: 1,
  }

  if (eventId) {
    payload.eventid = eventId
  }

  const data = await fetchJson<{ response?: { Attribute?: MispAttribute[] } }>(
    "/attributes/restSearch",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  return data.response?.Attribute ?? []
}

export async function getAttribute(attributeId: string) {
  return fetchJson<{ Attribute: MispAttribute }>(`/attributes/view/${attributeId}`)
}

export async function addAttribute(
  eventId: string,
  values: AttributeFormInput
) {
  return fetchJson<{ Attribute: MispAttribute }>(`/attributes/add/${eventId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Attribute: {
        category: values.category,
        type: values.type,
        value: values.value.trim(),
        to_ids: values.to_ids,
        comment: values.comment.trim(),
      },
    }),
  })
}

export async function editAttribute(
  attributeId: string,
  values: AttributeFormInput
) {
  return fetchJson<{ Attribute: MispAttribute }>(
    `/attributes/edit/${attributeId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Attribute: {
          category: values.category,
          type: values.type,
          value: values.value.trim(),
          to_ids: values.to_ids,
          comment: values.comment.trim(),
        },
      }),
    }
  )
}

export async function deleteAttribute(attributeId: string) {
  return fetchJson<ToggleResponse>(`/attributes/delete/${attributeId}`, {
    method: "DELETE",
  })
}

export async function listObjects(eventId?: string) {
  const payload: Record<string, string | number> = {
    returnFormat: "json",
    limit: 100,
    page: 1,
  }

  if (eventId) {
    payload.eventid = eventId
  }

  const data = await fetchJson<{ response?: Array<{ Object: MispObject }> }>(
    "/objects/restsearch",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  return (data.response ?? []).map((item) => item.Object)
}

export async function getObject(objectId: string) {
  return fetchJson<{ Object: MispObject; Attribute?: MispAttribute[] }>(
    `/objects/view/${objectId}`
  )
}

export async function deleteObject(objectId: string) {
  return fetchJson<ToggleResponse>(`/objects/delete/${objectId}/0`, {
    method: "DELETE",
  })
}

export async function getObjectTemplate(templateId: string) {
  return fetchJson<Record<string, unknown>>(`/objectTemplates/view/${templateId}`)
}

export async function listTaxonomies() {
  return fetchJson<MispTaxonomyListItem[]>("/taxonomies")
}

export async function getTaxonomy(taxonomyId: string) {
  return fetchJson<MispTaxonomy>(`/taxonomies/view/${taxonomyId}`)
}

export async function enableTaxonomy(taxonomyId: string) {
  return fetchJson<ToggleResponse>(`/taxonomies/enable/${taxonomyId}`, {
    method: "POST",
  })
}

export async function disableTaxonomy(taxonomyId: string) {
  return fetchJson<ToggleResponse>(`/taxonomies/disable/${taxonomyId}`, {
    method: "POST",
  })
}

export async function updateTaxonomies() {
  return fetchJson<ToggleResponse>("/taxonomies/update", {
    method: "POST",
  })
}

export async function listGalaxies() {
  return fetchJson<MispGalaxyListItem[]>("/galaxies")
}

export async function getGalaxy(galaxyId: string) {
  return fetchJson<MispGalaxy>(`/galaxies/view/${galaxyId}`)
}

export async function deleteGalaxy(galaxyId: string) {
  return fetchJson<ToggleResponse>(`/galaxies/delete/${galaxyId}`, {
    method: "DELETE",
  })
}

export async function updateGalaxies() {
  return fetchJson<ToggleResponse>("/galaxies/update", {
    method: "POST",
  })
}
