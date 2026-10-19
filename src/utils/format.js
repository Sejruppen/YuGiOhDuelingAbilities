function formatMaxUsesBadge(maxUses) {
  if (maxUses === null || maxUses === undefined) return 'Unlimited';
  return `${maxUses}x Duel`;
}
