// Added loader for RHCSA original practice set (markdown)
fetch('rhcsa_ex_200_original_practice_set_100_tasks.md')
  .then(r => r.text())
  .then(text => {
    document.getElementById('mdContent').textContent = text;
  })
  .catch(err => {
    document.getElementById('mdContent').textContent = 'Failed to load practice set.';
    console.error(err);
  });
