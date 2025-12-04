"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Copy,
  UserCheck,
  Clock,
  UserX,
  Users,
  Heart,
  Briefcase,
  Home,
  HelpCircle,
  UtensilsCrossed,
  Gift,
} from "lucide-react";
import type { Guest, GuestType, FamilyRelationship } from "@/types";

// Guest type configuration
const guestTypeConfig: Record<GuestType, { label: string; icon: typeof Users; color: string }> = {
  family: { label: "Family", icon: Heart, color: "bg-rose-100 text-rose-700" },
  friend: { label: "Friend", icon: Users, color: "bg-blue-100 text-blue-700" },
  coworker: { label: "Coworker", icon: Briefcase, color: "bg-purple-100 text-purple-700" },
  neighbor: { label: "Neighbor", icon: Home, color: "bg-green-100 text-green-700" },
  other: { label: "Other", icon: HelpCircle, color: "bg-gray-100 text-gray-700" },
};

// Family relationship labels
const relationshipLabels: Record<FamilyRelationship, string> = {
  mother: "Mother",
  father: "Father",
  sister: "Sister",
  brother: "Brother",
  daughter: "Daughter",
  son: "Son",
  grandmother: "Grandmother",
  grandfather: "Grandfather",
  aunt: "Aunt",
  uncle: "Uncle",
  cousin: "Cousin",
  niece: "Niece",
  nephew: "Nephew",
  great_aunt: "Great Aunt",
  great_uncle: "Great Uncle",
  second_cousin: "Second Cousin",
  cousin_once_removed: "Cousin Once Removed",
  distant_relative: "Distant Relative",
};

const statusConfig = {
  yes: { label: "Confirmed", color: "bg-green-100 text-green-700", icon: UserCheck },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  no: { label: "Declined", color: "bg-gray-100 text-gray-700", icon: UserX },
};

interface GuestTableProps {
  guests: Guest[];
  onDelete: (guest: Guest) => void;
  onSendReminder: (guest: Guest) => void;
  onCopyCode: (guest: Guest) => void;
}

export function GuestTable({ guests, onDelete, onSendReminder, onCopyCode }: GuestTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plus One</TableHead>
            <TableHead>Children</TableHead>
            <TableHead>Meal</TableHead>
            <TableHead>Gift</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => (
            <GuestTableRow
              key={guest.id}
              guest={guest}
              onDelete={onDelete}
              onSendReminder={onSendReminder}
              onCopyCode={onCopyCode}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface GuestTableRowProps {
  guest: Guest;
  onDelete: (guest: Guest) => void;
  onSendReminder: (guest: Guest) => void;
  onCopyCode: (guest: Guest) => void;
}

function GuestTableRow({ guest, onDelete, onSendReminder, onCopyCode }: GuestTableRowProps) {
  const status = statusConfig[guest.attendance_status];
  const guestType = guestTypeConfig[guest.guest_type] || guestTypeConfig.other;
  const GuestTypeIcon = guestType.icon;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {guest.first_name} {guest.last_name}
      </TableCell>
      <TableCell>
        <Badge className={guestType.color}>
          <GuestTypeIcon className="h-3 w-3 mr-1" />
          {guest.guest_type === "family" && guest.family_relationship
            ? relationshipLabels[guest.family_relationship]
            : guestType.label}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-500">{guest.email}</TableCell>
      <TableCell>
        <Badge className={status.color}>
          <status.icon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </TableCell>
      <TableCell>
        {guest.is_plus_one_coming ? (
          <Badge variant="outline" className="text-green-600">Yes</Badge>
        ) : (
          <span className="text-gray-400">No</span>
        )}
      </TableCell>
      <TableCell>
        {guest.has_children ? (
          <Badge variant="outline" className="text-blue-600">Yes</Badge>
        ) : (
          <span className="text-gray-400">No</span>
        )}
      </TableCell>
      <TableCell>
        {guest.meal_selection ? (
          <div className="flex items-center gap-1 text-sm">
            <UtensilsCrossed className="h-3 w-3 text-orange-500" />
            <span className="truncate max-w-[120px]" title={guest.meal_selection.meal_name}>
              {guest.meal_selection.meal_name}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>
        {guest.claimed_gifts && guest.claimed_gifts.length > 0 ? (
          <div className="flex items-center gap-1 text-sm">
            <Gift className="h-3 w-3 text-pink-500" />
            <span className="truncate max-w-[120px]" title={guest.claimed_gifts.map(g => g.name).join(", ")}>
              {guest.claimed_gifts.length === 1 
                ? guest.claimed_gifts[0].name 
                : `${guest.claimed_gifts.length} gifts`}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/guests/${guest.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopyCode(guest)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Invite Code
            </DropdownMenuItem>
            {guest.attendance_status === "pending" && (
              <DropdownMenuItem onClick={() => onSendReminder(guest)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(guest)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
