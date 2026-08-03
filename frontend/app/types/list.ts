export type ListRole = "owner" | "editor" | "viewer";

export interface ListMember {
  user: { _id: string; name: string; email: string };
  role: "editor" | "viewer";
}

export interface ListInvite {
  listId: string;
  listName: string;
  invitedBy: string;
  role: string;
  token: string;
}

export interface PantryList {
  _id: string;
  name: string;
  user: string;
  role: ListRole;
  members?: ListMember[];
  invites?: { email: string; role: string }[];
  shareToken?: string;
  createdAt?: string;
}
