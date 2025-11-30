"use client";

import { Search, Filter, X, Users, Heart, Briefcase, Home, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GuestType } from "@/types";

export type AttendanceFilter = "all" | "yes" | "pending" | "no";
export type GuestTypeFilter = "all" | GuestType;

interface GuestFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: AttendanceFilter;
  onStatusFilterChange: (value: AttendanceFilter) => void;
  typeFilter?: GuestTypeFilter;
  onTypeFilterChange?: (value: GuestTypeFilter) => void;
}

export function GuestFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter = "all",
  onTypeFilterChange,
}: GuestFiltersProps) {
  const hasFilters = search || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onTypeFilterChange?.("all");
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="yes">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="no">Declined</SelectItem>
          </SelectContent>
        </Select>

        {onTypeFilterChange && (
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-40">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="family">
                <span className="flex items-center">
                  <Heart className="h-3 w-3 mr-2 text-rose-500" />
                  Family
                </span>
              </SelectItem>
              <SelectItem value="friend">
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-2 text-blue-500" />
                  Friend
                </span>
              </SelectItem>
              <SelectItem value="coworker">
                <span className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-2 text-purple-500" />
                  Coworker
                </span>
              </SelectItem>
              <SelectItem value="neighbor">
                <span className="flex items-center">
                  <Home className="h-3 w-3 mr-2 text-green-500" />
                  Neighbor
                </span>
              </SelectItem>
              <SelectItem value="other">
                <span className="flex items-center">
                  <HelpCircle className="h-3 w-3 mr-2 text-gray-500" />
                  Other
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
