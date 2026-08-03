export const isOwner = (list, userId) => String(list.user) === String(userId);

export const memberRole = (list, userId) => {
  if (isOwner(list, userId)) return "owner";
  const member = (list.members || []).find(
    (m) => String(m.user) === String(userId)
  );
  return member ? member.role : null;
};

export const canView = (role) => role === "owner" || role === "editor" || role === "viewer";

export const canEdit = (role) => role === "owner" || role === "editor";
