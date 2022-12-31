function sendRoleUpdate(newRole, userId) {
  const url = '/members/manage_users?form=role';

  const data = {
    userId: userId,
    newRole: newRole
  };

  fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
}

function passwordReset(userId) {
  const url = '/members/manage_users?form=pswd';

  const data = {
    userId: userId
  };

  fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
}

function inviteCopy(event) {
  navigator.clipboard.writeText(event.target.parentNode.parentNode.querySelector("code").innerText)
}