"use client";

import { Home, Mail, Phone, School } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateAddress, updateParent, updateStar } from "@/lib/data";
import { formatDate, formatGrade } from "@/lib/format";
import type { Family } from "@/lib/types";

import { EditDialog } from "./edit-dialog";

interface FamilyInfoProps {
  family: Family;
  onChange: (family: Family) => void;
}

export function FamilyInfo({ family, onChange }: FamilyInfoProps) {
  const { address } = family;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {family.stars.map((star) => (
        <Card key={star.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="size-4 text-brand-gold" />
              {star.firstName}&apos;s school
            </CardTitle>
            <CardDescription>Keep this current so we can coordinate with teachers.</CardDescription>
            <CardAction>
              <EditDialog
                title="School info"
                fields={[
                  { name: "school", label: "School" },
                  { name: "schoolDistrict", label: "School district" },
                  { name: "grade", label: "Grade", type: "number" },
                ]}
                values={{
                  school: star.school,
                  schoolDistrict: star.schoolDistrict,
                  grade: String(star.grade),
                }}
                onSave={async (v) => {
                  const grade = Number(v.grade);
                  if (!Number.isInteger(grade) || grade < 0 || grade > 12) {
                    throw new Error("Grade must be a whole number from 0 to 12");
                  }
                  const updated = await updateStar(star.id, {
                    school: v.school.trim(),
                    schoolDistrict: v.schoolDistrict.trim(),
                    grade,
                  });
                  onChange({
                    ...family,
                    stars: family.stars.map((s) => (s.id === updated.id ? updated : s)),
                  });
                }}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="School" value={star.school} />
              <Field label="District" value={star.schoolDistrict} />
              <Field label="Grade" value={formatGrade(star.grade)} />
              <Field label="Member since" value={formatDate(star.joinedDate)} />
            </dl>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="size-4 text-brand-gold" />
            Home address
          </CardTitle>
          <CardDescription>Where we send pins, books, and camp materials.</CardDescription>
          <CardAction>
            <EditDialog
              title="Home address"
              fields={[
                { name: "street", label: "Street" },
                { name: "city", label: "City" },
                { name: "state", label: "State" },
                { name: "zip", label: "ZIP code" },
              ]}
              values={address}
              onSave={async (v) => {
                const updated = await updateAddress({
                  street: v.street.trim(),
                  city: v.city.trim(),
                  state: v.state.trim().toUpperCase(),
                  zip: v.zip.trim(),
                });
                onChange(updated);
              }}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <address className="not-italic leading-relaxed">
            {address.street}
            <br />
            {address.city}, {address.state} {address.zip}
          </address>
        </CardContent>
      </Card>

      {family.parents.map((parent) => (
        <Card key={parent.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {parent.firstName} {parent.lastName}
              {parent.isPrimary && <Badge variant="secondary">Primary contact</Badge>}
            </CardTitle>
            <CardDescription>{parent.relationship}</CardDescription>
            <CardAction>
              <EditDialog
                title="Contact info"
                description={`${parent.firstName} ${parent.lastName}`}
                fields={[
                  { name: "firstName", label: "First name" },
                  { name: "lastName", label: "Last name" },
                  { name: "email", label: "Email", type: "email" },
                  { name: "phone", label: "Phone", type: "tel" },
                ]}
                values={{
                  firstName: parent.firstName,
                  lastName: parent.lastName,
                  email: parent.email,
                  phone: parent.phone,
                }}
                onSave={async (v) => {
                  const updated = await updateParent(parent.id, {
                    firstName: v.firstName.trim(),
                    lastName: v.lastName.trim(),
                    email: v.email.trim(),
                    phone: v.phone.trim(),
                  });
                  onChange({
                    ...family,
                    parents: family.parents.map((p) => (p.id === updated.id ? updated : p)),
                  });
                }}
              />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a
              href={`mailto:${parent.email}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Mail className="size-4 text-muted-foreground" />
              {parent.email}
            </a>
            <a
              href={`tel:${parent.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Phone className="size-4 text-muted-foreground" />
              {parent.phone}
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
