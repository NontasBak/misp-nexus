import { useQuery } from "@tanstack/react-query"
import { Link, createRoute } from "@tanstack/react-router"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { AlertCircleIcon, PlusIcon, RotateCwIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  analysisLabels,
  distributionLabels,
  listEvents,
  threatLevelLabels,
  type EventIndexFilters,
  type MispEventIndexItem,
} from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: EventsIndexPage,
})

const columns: Array<ColumnDef<MispEventIndexItem>> = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <a className="font-medium underline-offset-4 hover:underline" href={`/misp/events/view/${row.original.id}`}>
        {row.original.id}
      </a>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "Orgc.name",
    header: "Orgc",
    cell: ({ row }) => row.original.Orgc?.name ?? "-",
  },
  {
    accessorKey: "info",
    header: "Info",
    cell: ({ row }) => (
      <div className="max-w-xl truncate" title={row.original.info}>
        {row.original.info}
      </div>
    ),
  },
  {
    accessorKey: "attribute_count",
    header: "Attrs",
    cell: ({ row }) => row.original.attribute_count ?? "0",
  },
  {
    accessorKey: "threat_level_id",
    header: "Threat",
    cell: ({ row }) =>
      threatLevelLabels[row.original.threat_level_id ?? ""] ?? "-",
  },
  {
    accessorKey: "analysis",
    header: "Analysis",
    cell: ({ row }) => analysisLabels[row.original.analysis ?? ""] ?? "-",
  },
  {
    accessorKey: "distribution",
    header: "Distribution",
    cell: ({ row }) =>
      distributionLabels[row.original.distribution ?? ""] ?? "-",
  },
  {
    accessorKey: "published",
    header: "Published",
    cell: ({ row }) => (
      <Badge variant={row.original.published ? "default" : "secondary"}>
        {row.original.published ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" asChild>
        <a href={`/misp/events/view/${row.original.id}`}>View</a>
      </Button>
    ),
  },
]

function EventsIndexPage() {
  const [draftFilters, setDraftFilters] = useState<EventIndexFilters>({})
  const [filters, setFilters] = useState<EventIndexFilters>({})

  const eventsQuery = useQuery({
    queryKey: ["events", filters],
    queryFn: () => listEvents(filters),
  })

  const events = eventsQuery.data?.events ?? []
  const table = useReactTable({
    data: events,
    columns: useMemo(() => columns, []),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            {eventsQuery.data ? `${eventsQuery.data.count} event result(s)` : "MISP event index"}
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => eventsQuery.refetch()}>
              <RotateCwIcon data-icon="inline-start" />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link to="/events/add">
                <PlusIcon data-icon="inline-start" />
                Add Event
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form
            className="mb-4 flex flex-col gap-3 md:flex-row md:items-end"
            onSubmit={(event) => {
              event.preventDefault()
              setFilters(draftFilters)
            }}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="eventinfo">
                Info
              </label>
              <Input
                id="eventinfo"
                value={draftFilters.eventinfo ?? ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    eventinfo: event.target.value,
                  }))
                }
                placeholder="Search event info"
              />
            </div>
            <div className="flex min-w-40 flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="published">
                Published
              </label>
              <Select
                value={draftFilters.published ?? "all"}
                onValueChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    published: value === "all" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger id="published" className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">Published</SelectItem>
                    <SelectItem value="0">Unpublished</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                <SearchIcon data-icon="inline-start" />
                Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftFilters({})
                  setFilters({})
                }}
              >
                Clear
              </Button>
            </div>
          </form>

          {eventsQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Unable to load events</AlertTitle>
              <AlertDescription>
                {eventsQuery.error instanceof Error
                  ? eventsQuery.error.message
                  : "MISP did not return the event index."}
              </AlertDescription>
            </Alert>
          ) : eventsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : events.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>No events found</EmptyTitle>
                <EmptyDescription>
                  Adjust the filters or create a new event.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link to="/events/add">Add Event</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
