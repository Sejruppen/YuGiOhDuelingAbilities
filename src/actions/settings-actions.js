function goToSettings() {
  resetPeek();
  setState({ screen: SCREENS.SETTINGS });
}

function leaveSettings() {
  setState({ screen: SCREENS.START });
}
