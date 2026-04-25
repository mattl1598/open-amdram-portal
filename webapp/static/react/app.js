"use strict";

Object.assign(String.prototype, {
  capitalize: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
});
function Accounting({
  content
}) {
  if (content.sub_type === "full_year_overview") {
    const [subsJson, setSubsJson] = React.useState({});
    const [ticketsJson, setTicketsJson] = React.useState([]);
    let accounted = {
      total: 0,
      fees: 0,
      refunds: 0,
      net: 0
    };
    function renderTickets() {
      let tickets = [];
      for (let i = 0; i < ticketsJson.length; i++) {
        accounted.total = accounted.total + ticketsJson[i].totals.total;
        accounted.fees = accounted.fees + ticketsJson[i].totals.fees;
        accounted.refunds = accounted.refunds + ticketsJson[i].totals.refunds;
        accounted.net = accounted.net + ticketsJson[i].totals.net;
        tickets.push(/*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, ticketsJson[i].title), /*#__PURE__*/React.createElement("td", null, "\xA3", ticketsJson[i].totals.total / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", ticketsJson[i].totals.fees / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", ticketsJson[i].totals.refunds / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", ticketsJson[i].totals.net / 100.0)));
      }
      return tickets;
    }

    // GET SUBS
    React.useEffect(() => {
      const response = fetch(`/members/api/get_subs?startyear=${content.year}`).then(response => response.json()).then(data => {
        setSubsJson({
          ...data
        });
      });
    }, []);

    // GET SHOWS
    React.useEffect(() => {
      // let shows = []
      for (let i = 0; i < content.shows.length; i++) {
        const response = fetch(`/members/api/historic_sales?show_id=${content.shows[i].id}`).then(response => response.json()).then(data => {
          data.title = content.shows[i].title;
          console.log(data);
          console.log(ticketsJson);
          setTicketsJson(a => [...a, data]);
        });
      }
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("table", {
      className: "table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Source"), /*#__PURE__*/React.createElement("th", null, "Total"), /*#__PURE__*/React.createElement("th", null, "Fees"), /*#__PURE__*/React.createElement("th", null, "Refunds"), /*#__PURE__*/React.createElement("th", null, "Net"))), /*#__PURE__*/React.createElement("tbody", null, subsJson.totals ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Subs"), /*#__PURE__*/React.createElement("td", null, "\xA3", subsJson.totals.total / 100.0, [accounted.total = accounted.total + subsJson.totals.total, ""][1]), /*#__PURE__*/React.createElement("td", null, "\xA3", subsJson.totals.fees / 100.0, [accounted.fees = accounted.fees + subsJson.totals.fees, ""][1]), /*#__PURE__*/React.createElement("td", null, "\xA3", subsJson.totals.refunds / 100.0, [accounted.refunds = accounted.refunds + subsJson.totals.refunds, ""][1]), /*#__PURE__*/React.createElement("td", null, "\xA3", subsJson.totals.net / 100.0, [accounted.net = accounted.net + subsJson.totals.net, ""][1])) : /*#__PURE__*/React.createElement(React.Fragment, null), ticketsJson.length ? renderTickets() : /*#__PURE__*/React.createElement(React.Fragment, null), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Other (FOH)"), /*#__PURE__*/React.createElement("td", null, "\xA3", (content.totals.total_amounts - accounted.total) / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", (content.totals.total_fees - accounted.fees) / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", (content.totals.total_refund_amounts - accounted.refunds) / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", (content.totals.total_net - accounted.net) / 100.0)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Total"), /*#__PURE__*/React.createElement("td", null, "\xA3", content.totals.total_amounts / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", content.totals.total_fees / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", content.totals.total_refund_amounts / 100.0), /*#__PURE__*/React.createElement("td", null, "\xA3", content.totals.total_net / 100.0)))));
  }
}
function GetSubs({
  content
}) {
  const context = React.useContext(app);
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  function updateSubs(e) {
    e.preventDefault();
    fetch("/members/api/update_subs", {}).then(response => response.json()).then(data => {
      if (data.code === 200) {
        context.functions.refresh();
      } else {
        console.error('Error:', data.msg);
        displayAlerts([{
          title: `Error: ${data.code}`,
          content: data.msg
        }]);
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, "Get Subs"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: updateSubs
  }, /*#__PURE__*/React.createElement("h3", null, "Update Subs")), /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Datetime"), /*#__PURE__*/React.createElement("th", null, "Source"), /*#__PURE__*/React.createElement("th", null, "Amount"), /*#__PURE__*/React.createElement("th", null, "Fee"))), /*#__PURE__*/React.createElement("tbody", null, content.results.map((result, i) => {
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", null, result.name), /*#__PURE__*/React.createElement("td", null, result.type.capitalize()), /*#__PURE__*/React.createElement("td", null, result.date), /*#__PURE__*/React.createElement("td", null, result.source.capitalize()), /*#__PURE__*/React.createElement("td", null, "\xA3", (result.amount / 100.0).toFixed(2)), /*#__PURE__*/React.createElement("td", null, "\xA3", (result.fee / 100.0).toFixed(2)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Total:"), /*#__PURE__*/React.createElement("th", null, "\xA3", (content.totals.net / 100.0).toFixed(2)), /*#__PURE__*/React.createElement("th", null), /*#__PURE__*/React.createElement("th", null, "SubTotal:"), /*#__PURE__*/React.createElement("th", null, "\xA3", (content.totals.total / 100.0).toFixed(2)), /*#__PURE__*/React.createElement("th", null, "\xA3", (content.totals.fees / 100.0).toFixed(2))))));
}

"use strict";

function AdminSettings({
  content,
  refresh
}) {
  const context = React.useContext(app);
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  let subs = [];
  for (let i = 0; i < (content.subs || []).length; i++) {
    let sub = content.subs[i];
    subs.push(/*#__PURE__*/React.createElement("div", {
      key: i,
      className: "sub",
      style: {
        order: sub.amount
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "type"
    }, /*#__PURE__*/React.createElement("h3", {
      className: ""
    }, sub.name)), /*#__PURE__*/React.createElement("div", {
      className: "rate"
    }, /*#__PURE__*/React.createElement("strong", null, "Rate: "), /*#__PURE__*/React.createElement("span", {
      className: "rate"
    }, "\xA3", (sub.amount / 100).toFixed(2))), /*#__PURE__*/React.createElement("div", {
      className: "billing"
    }, /*#__PURE__*/React.createElement("strong", null, "Period: "), /*#__PURE__*/React.createElement("span", {
      className: "period"
    }, sub.period))));
  }
  let show_options = [];
  console.log(context.siteJson);
  for (let i = 0; i < context.siteJson.mostRecentMemberShows.length; i++) {
    console.log(context.siteJson.mostRecentMemberShows[i].title);
    show_options.push(/*#__PURE__*/React.createElement("option", {
      value: context.siteJson.mostRecentMemberShows[i].title
    }, context.siteJson.mostRecentMemberShows[i].title));
  }
  console.log(show_options);
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
    className: "form_container two"
  }, /*#__PURE__*/React.createElement("form", {
    action: "/members/api/admin/admin_settings/site_settings",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Site Settings"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "site-name",
    label: "Site Name",
    value: content.settings.siteName
  }), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "tickets-active",
    label: "Enable Tickets",
    value: content.settings.ticketsActive
  }, /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "Off"), /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "On")), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "show_auditions",
    label: "Set Show for Auditions",
    value: content.settings.show_auditions
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "None Selected..."), show_options), /*#__PURE__*/React.createElement(Input, {
    type: "datetime-local",
    id: "auditions_date",
    label: "Auditions Date",
    value: content.settings.auditions_date
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "tickets-link",
    label: "Tickets URL",
    value: content.settings.ticketsLink
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "tickets-hero-photo",
    label: "Tickets Hero Photo",
    value: content.settings.ticketsHeroPhoto
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "socials",
    label: "Social Links (comma seperated)",
    value: content.settings.socials
  }), /*#__PURE__*/React.createElement(Input, {
    type: "textarea",
    id: "about",
    label: "About Us Content (Markdown)",
    value: content.settings.about
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "maps-url",
    label: "Google Maps URL",
    value: content.settings.mapsURL
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    id: "submit",
    value: "Save Settings"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    className: "subs",
    action: "/members/api/admin/admin_settings/subs/add_new_plan",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Subs Options"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("div", {
    className: "subs"
  }, subs), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "Add New Subs Level"), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "levelName",
    label: "Level Name"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "number",
    id: "amount",
    label: "Amount"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "period",
    label: "Period"
  }, /*#__PURE__*/React.createElement("option", {
    value: "yearly"
  }, "Yearly")), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "renewal_month",
    label: "Renewal Month (for yearly)"
  }, /*#__PURE__*/React.createElement("option", {
    value: "01"
  }, "January"), /*#__PURE__*/React.createElement("option", {
    value: "02"
  }, "February"), /*#__PURE__*/React.createElement("option", {
    value: "03"
  }, "March"), /*#__PURE__*/React.createElement("option", {
    value: "04"
  }, "April"), /*#__PURE__*/React.createElement("option", {
    value: "05"
  }, "May"), /*#__PURE__*/React.createElement("option", {
    value: "06"
  }, "June"), /*#__PURE__*/React.createElement("option", {
    value: "07"
  }, "July"), /*#__PURE__*/React.createElement("option", {
    value: "08"
  }, "August"), /*#__PURE__*/React.createElement("option", {
    value: "09"
  }, "September"), /*#__PURE__*/React.createElement("option", {
    value: "10"
  }, "October"), /*#__PURE__*/React.createElement("option", {
    value: "11"
  }, "November"), /*#__PURE__*/React.createElement("option", {
    value: "12"
  }, "December")), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    id: "submit",
    value: "Add Subs Level"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }))));
}
function ManageMedia({
  content
}) {
  const context = React.useContext(app);
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        context.functions.refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  function copyMe(id) {
    navigator.clipboard.writeText(document.getElementById(id).innerHTML);
  }
  function clearDetails() {
    setSelectedID(null);
    // setSelectedUID("")
    setSelectedURL("");
    setSelectedSRC("");
    setSelectedTitle("");
  }

  // TODO: Delete button functionality (+ API)

  const [selectedID, setSelectedID] = React.useState(null);
  const [selectedUID, setSelectedUID] = React.useState("");
  const [selectedURL, setSelectedURL] = React.useState("");
  const [selectedSRC, setSelectedSRC] = React.useState("");
  const [selectedTitle, setSelectedTitle] = React.useState("");
  React.useEffect(() => {
    if (selectedID != null) {
      setSelectedUID(content.media[selectedID][0]);
      setSelectedURL(`/media/${content.media[selectedID][0]}/${content.media[selectedID][2]}`);
      setSelectedSRC(content.media[selectedID][1]);
      setSelectedTitle(content.media[selectedID][2]);
      document.querySelector("#deleteForm").querySelector("span.msg").innerHTML = "";
    }
  }, [selectedID]);
  let mediaItems = [];
  if (content.media) {
    for (let i = 0; i < content.media.length; i++) {
      let image = content.media[i];
      mediaItems.push(/*#__PURE__*/React.createElement("div", {
        key: i,
        className: "media_item",
        onClick: () => {
          setSelectedID(i);
        }
      }, /*#__PURE__*/React.createElement(Image, {
        src: `${image[1]}?lowres`,
        alt: image[0],
        title: image[2],
        width: "200",
        height: "200"
      })));
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "details"
  }, /*#__PURE__*/React.createElement("div", {
    className: "upload"
  }, /*#__PURE__*/React.createElement("h3", null, "Upload New Item"), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/manage_media/upload",
    onSubmit: handleFormSubmit,
    method: "POST",
    encType: "multipart/form-data"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("input", {
    type: "file",
    name: "fileElem",
    id: "fileElem"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit"
  }, "Upload")), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
    id: "info",
    className: selectedID != null ? "" : "greyed"
  }, /*#__PURE__*/React.createElement("h3", null, "Items Details"), /*#__PURE__*/React.createElement("div", {
    className: "item_name"
  }, "Filename: ", /*#__PURE__*/React.createElement("span", {
    className: "box scroll",
    id: "filename"
  }, selectedID != null ? selectedTitle : "Please select an item...")), /*#__PURE__*/React.createElement("div", {
    className: "url"
  }, "Media URL: ", /*#__PURE__*/React.createElement("span", {
    className: "box scroll",
    id: "url"
  }, selectedID != null ? selectedURL : "Please select an item..."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      copyMe('url');
    }
  }, "Copy")), /*#__PURE__*/React.createElement("div", null, "Preview: ", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("div", {
    className: "image box"
  }, /*#__PURE__*/React.createElement("img", {
    id: "image",
    src: selectedSRC,
    alt: ""
  }))), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/manage_media/delete",
    id: "deleteForm",
    onSubmit: handleFormSubmit,
    method: "POST"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "id",
    value: selectedUID
  }), /*#__PURE__*/React.createElement("input", {
    type: "submit",
    value: "Delete",
    onClick: clearDetails
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/manage_media/modernise",
    id: "moderniseForm",
    onSubmit: handleFormSubmit,
    method: "POST"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "id",
    value: selectedUID
  }), /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "filename",
    value: selectedTitle
  }), /*#__PURE__*/React.createElement("input", {
    type: "submit",
    value: "Modernise"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "media_items"
  }, mediaItems)));
}
function ShowPhotosForm({
  content
}) {
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  let album_options = [];
  let show_options = [];
  for (let i = 0; i < content.albums.length; i++) {
    album_options.push(/*#__PURE__*/React.createElement("option", {
      key: content.albums[i][0],
      value: content.albums[i][0]
    }, content.albums[i][1]));
  }
  for (let i = 0; i < content.shows.length; i++) {
    show_options.push(/*#__PURE__*/React.createElement("option", {
      key: content.shows[i].id,
      value: content.shows[i].id
    }, content.shows[i].date.substring(0, 4), " - ", content.shows[i].title));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/admin/set_show_photos",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "album"
  }, "Album: "), /*#__PURE__*/React.createElement("select", {
    name: "album",
    id: "album"
  }, album_options), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("label", {
    htmlFor: "show"
  }, "Show: "), /*#__PURE__*/React.createElement("select", {
    name: "show",
    id: "show"
  }, show_options), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("input", {
    type: "submit"
  })));
}

"use strict";

function formToJson(formData) {
  let obj = {};
  formData.forEach((value, key) => {
    if (obj[key]) {
      // If the key already exists, convert it to an array and add the new value
      if (!Array.isArray(obj[key])) {
        obj[key] = [obj[key]];
      }
      obj[key].push(value);
    } else {
      // Otherwise, assign the value
      obj[key] = value;
    }
  });
  return obj;
}
function insert(list, position, item) {
  let listA = [...list.slice(0, position)];
  let listB = [...list.slice(position)];
  return [...listA, item, ...listB];
}
function EditShow({
  content,
  refresh
}) {
  const context = React.useContext(app);
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        showID: content.showDetails.id,
        showDetails: formToJson(formData),
        roles: getRoles()
      })
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        context.functions.refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  if (!content.showDetails) {
    content.showDetails = {
      title: "",
      subtitle: "",
      date: Date.now(),
      season: "",
      genre: "",
      author: "",
      show_type: "",
      programme: "",
      banner: "",
      noda_review: "",
      radio_audio: "",
      text_blob: ""
    };
  }
  if (!content.showOptions) {
    content.showOptions = {
      genres: [],
      seasons: [],
      showTypes: []
    };
  }
  let genreOptions = [/*#__PURE__*/React.createElement("option", {
    key: "",
    value: ""
  })];
  for (let i = 0; i < content.showOptions.genres.length; i++) {
    let val = content.showOptions.genres[i];
    if (val !== "") {
      genreOptions.push(/*#__PURE__*/React.createElement("option", {
        key: val,
        value: val
      }, val));
    }
  }
  let seasonOptions = [/*#__PURE__*/React.createElement("option", {
    key: "",
    value: ""
  })];
  for (let i = 0; i < content.showOptions.seasons.length; i++) {
    let val = content.showOptions.seasons[i];
    if (val !== "") {
      seasonOptions.push(/*#__PURE__*/React.createElement("option", {
        key: val,
        value: val
      }, val));
    }
  }
  let showTypeOptions = [/*#__PURE__*/React.createElement("option", {
    key: "",
    value: ""
  })];
  for (let i = 0; i < content.showOptions.showTypes.length; i++) {
    let val = content.showOptions.showTypes[i];
    if (val !== "") {
      showTypeOptions.push(/*#__PURE__*/React.createElement("option", {
        key: val,
        value: val
      }, val));
    }
  }
  const [bannerPreview, setBannerPreview] = React.useState(content.showDetails.banner);
  const [programmePreview, setProgrammePreview] = React.useState(content.showDetails.programme);
  const [memberOptions, setMemberOptions] = React.useState([]);
  const [castRefs, setCastRefs] = React.useState([]);
  const [castList, setCastList] = React.useState([]);
  const [crewRefs, setCrewRefs] = React.useState([]);
  const [crewList, setCrewList] = React.useState([]);
  const [toBeAdded, setToBeAdded] = React.useState([]);
  function refreshMemberOptions() {
    fetch("/members/api/get_members", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json()).then(data => {
      if (Array.isArray(data)) {
        setMemberOptions(data);
      } else {
        console.error("Unexpected response format:", data);
      }
    }).catch(err => console.error("Failed to fetch members:", err));
  }
  React.useEffect(() => {
    refreshMemberOptions();
    let tempCastRefs = [];
    let tempCastRoles = [];
    let tempCrewRefs = [];
    let tempCrewRoles = [];
    for (let i = 0; i < content.currentRoles.length; i++) {
      let item = content.currentRoles[i];
      let newRef = React.createRef();
      let newRole = {
        key: i,
        ref: newRef,
        id: `${item.cast_or_crew}${{
          "cast": tempCastRoles.length,
          "crew": tempCrewRoles.length
        }[item.cast_or_crew] + 1}`,
        defaultMembers: item.members,
        defaultRoleName: item.role,
        cast_or_crew: item.cast_or_crew
      };
      if (item.cast_or_crew === "cast") {
        tempCastRefs.push(newRef);
        tempCastRoles.push(newRole);
      } else {
        tempCrewRefs.push(newRef);
        tempCrewRoles.push(newRole);
      }
    }
    setCastRefs(tempCastRefs);
    setCastList(tempCastRoles);
    setCrewRefs(tempCrewRefs);
    setCrewList(tempCrewRoles);
  }, []);
  function addRowBelow(cast_or_crew, position) {
    setToBeAdded([{
      cast_or_crew: cast_or_crew,
      position: position
    }]);
  }
  React.useEffect(() => {
    if (toBeAdded.length) {
      addRoleSubForm(undefined, toBeAdded[0].cast_or_crew, toBeAdded[0].position);
      setToBeAdded([]);
    }
  }, [toBeAdded]);
  function addRoleSubForm(e, cast_or_crew, position) {
    if (e !== undefined) {
      e.preventDefault();
    }
    // let tempRefs = []
    let tempList = [];
    if (cast_or_crew === "cast") {
      // tempRefs = [...castRefs]
      tempList = [...castList];
      let newRef = React.createRef();
      let newForm = {
        key: Date.now(),
        ref: newRef,
        id: `${cast_or_crew}${tempList.length + 1}`,
        cast_or_crew: cast_or_crew
      };
      // tempRefs = insert(tempRefs, position, newRef)
      tempList = insert(tempList, position, newForm);
      // setCastRefs(tempRefs)
      setCastList(tempList);
    } else {
      // tempRefs = [...crewRefs]
      tempList = [...crewList];
      let newRef = React.createRef();
      // TODO: add role options and tomselect for crew roles
      let newForm = {
        key: Date.now(),
        ref: newRef,
        id: `${cast_or_crew}${tempList.length + 1}`,
        cast_or_crew: cast_or_crew
      };
      // tempRefs.splice(position, 0, newRef)
      tempList.splice(position, 0, newForm);
      // setCrewRefs(tempRefs)
      setCrewList(tempList);
    }
    // TODO: set focus on newest role field
  }
  function getRoles(e = undefined) {
    if (e !== undefined) {
      e.preventDefault();
    }
    let output = [];
    for (let i = 0; i < castList.length; i++) {
      let msl = castList[i].ref.current.getMSLJson();
      if (msl !== null) {
        output.push(msl);
      }
    }
    for (let i = 0; i < crewList.length; i++) {
      let msl = crewList[i].ref.current.getMSLJson();
      if (msl !== null) {
        output.push(msl);
      }
    }
    return output;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("form", {
    action: `/members/api/manage_shows`,
    onSubmit: handleFormSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form show_form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("div", {
    className: "details"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "title",
    label: "Title",
    value: content.showDetails.title
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "subtitle",
    label: "Subtitle",
    value: content.showDetails.subtitle
  }), /*#__PURE__*/React.createElement(Input, {
    type: "date",
    id: "date",
    label: "Last Performance Date",
    value: content.showDetails.date.split("T")[0]
  }), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "season",
    label: "Season",
    value: content.showDetails.season
  }, seasonOptions), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "genre",
    label: "Genre",
    value: content.showDetails.genre
  }, genreOptions), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "show_type",
    label: "Show Type",
    value: content.showDetails.show_type
  }, showTypeOptions), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "author",
    label: "Author",
    value: content.showDetails.author
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "banner",
    label: "Banner Image",
    value: content.showDetails.banner,
    onChange: e => {
      setBannerPreview(e.target.value);
    }
  }), /*#__PURE__*/React.createElement("img", {
    className: "banner_preview",
    src: bannerPreview,
    alt: "banner preview"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "noda_review",
    label: "NODA Review",
    value: content.showDetails.noda_review
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "radio_audio",
    label: "Radio Audio",
    value: content.showDetails.radio_audio
  })), /*#__PURE__*/React.createElement("div", {
    className: "blob"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "programme",
    label: "Programme Cover",
    value: content.showDetails.programme,
    onChange: e => {
      setProgrammePreview(e.target.value);
    }
  }), /*#__PURE__*/React.createElement("img", {
    className: "programme_preview",
    src: programmePreview,
    alt: "programme preview"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "text_blob",
    label: "Text Blob",
    value: content.showDetails.text_blob
  }), /*#__PURE__*/React.createElement("h2", null, /*#__PURE__*/React.createElement(Link, {
    href: `/members/manage_shows/photos/${content.showDetails.id}/${content.showDetails.title}`
  }, "Manage Photos"))), /*#__PURE__*/React.createElement("div", {
    className: "save"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    value: "Save"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cast"
  }, /*#__PURE__*/React.createElement("h2", null, "Cast ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      addRoleSubForm(e, "cast", 0);
    }
  }, "+")), /*#__PURE__*/React.createElement("div", null, castList.map(x => {
    return /*#__PURE__*/React.createElement(RoleSubForm, {
      key: x.key,
      ref: x.ref,
      id: x.id,
      defaultMembers: x.defaultMembers,
      defaultRoleName: x.defaultRoleName,
      cast_or_crew: x.cast_or_crew,
      showID: content.showDetails.id,
      addRowBelow: addRowBelow,
      memberOptions: memberOptions,
      setMemberOptions: setMemberOptions
    });
  }))), /*#__PURE__*/React.createElement("div", {
    className: "crew"
  }, /*#__PURE__*/React.createElement("h2", null, "Crew ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      addRoleSubForm(e, "crew", 0);
    }
  }, "+")), /*#__PURE__*/React.createElement("div", null, crewList.map(x => {
    return /*#__PURE__*/React.createElement(RoleSubForm, {
      key: x.key,
      ref: x.ref,
      id: x.id,
      defaultMembers: x.defaultMembers,
      defaultRoleName: x.defaultRoleName,
      cast_or_crew: x.cast_or_crew,
      showID: content.showDetails.id,
      addRowBelow: addRowBelow,
      memberOptions: memberOptions,
      setMemberOptions: setMemberOptions
    });
  }))), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      console.log(getRoles(e));
    }
  }, "test")), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "",
    id: "MSL"
  }));
}
const RoleSubForm = React.forwardRef(function RoleSubForm({
  id,
  defaultRoleName = "",
  defaultMembers = [],
  showID = "",
  memberOptions = [],
  setMemberOptions,
  cast_or_crew,
  addRowBelow
}, ref) {
  const [role, setRole] = React.useState(defaultRoleName);
  const [members, setMembers] = React.useState(defaultMembers);
  const subFormRef = React.createRef();
  React.useImperativeHandle(ref, () => ({
    getMSLJson() {
      return getMSLJson();
    }
  }));
  function getIndex() {
    let fiberKey = Object.keys(subFormRef.current)[0];
    return subFormRef.current[fiberKey].return.index;
  }
  function getMSLJson() {
    if (role && members.length) {
      return {
        showID: showID,
        role: role,
        cast_or_crew: cast_or_crew,
        members: members,
        orderVal: getIndex()
      };
    } else {
      return null;
    }
  }
  function addNewMember(name) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/members/api/add_member", false); // false makes the request synchronous
    xhr.setRequestHeader("Content-Type", "application/json");
    let response = null;
    try {
      xhr.send(JSON.stringify({
        name: name
      }));
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.code === 200 && data.newMember) {
          setMemberOptions(data.members);
          return {
            value: data.newMember.id,
            text: data.newMember.name
          }; // Return the newMember item
        } else if (data.code === 400) {
          displayAlerts([{
            title: "Error",
            content: data.msg
          }]);
        } else {
          console.error("Unexpected response:", data);
        }
      } else {
        console.error("Request failed with status:", xhr.status);
      }
    } catch (err) {
      console.error("Failed to send request:", err);
    }
    return null; // Return null if the operation was unsuccessful
  }
  function addRow() {
    let pos = getIndex() + 1;
    addRowBelow(cast_or_crew, pos);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "role_sub_form",
    ref: subFormRef
  }, /*#__PURE__*/React.createElement(Icon, {
    onClick: () => {
      console.log(getIndex());
    }
  }, "drag_indicator"), /*#__PURE__*/React.createElement(Input, {
    id: id,
    form: "MSL",
    type: "text",
    label: "Role",
    value: role,
    stateful: true,
    onChange: e => {
      setRole(e.target.value);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "members"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: `member${id}`,
    className: "membersLabel"
  }, "Members"), /*#__PURE__*/React.createElement(Select, {
    id: `member${id}`,
    selected: members,
    setSelected: setMembers,
    options: memberOptions,
    create: addNewMember
  })), /*#__PURE__*/React.createElement("div", {
    className: "hover_right"
  }), /*#__PURE__*/React.createElement(Icon, {
    onClick: addRow,
    tabIndex: 0
  }, "splitscreen_add"));
});
function PastShowPhotos({
  content
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement(Tabs, null, /*#__PURE__*/React.createElement(Tab, {
    title: "Photo Manager"
  }, /*#__PURE__*/React.createElement(PhotoManager, {
    content: content
  })), /*#__PURE__*/React.createElement(Tab, {
    title: "FaceDetection"
  }, /*#__PURE__*/React.createElement(FaceDetection, {
    content: content
  }))));
}
function PhotoManager({
  content
}) {
  const context = React.useContext(app);
  const [images, setImages] = React.useState([]);
  const [isDragging, setIsDragging] = React.useState("");
  const [resetter, setResetter] = React.useState(0);
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        context.functions.refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  React.useEffect(() => {
    let tempImages = [];
    for (let i = 0; i < content.photos.length; i++) {
      let im = content.photos[i];
      tempImages.push({
        id: im.id,
        src: `/photo_new/${im.id}?lowres`,
        order_value: im.order_value,
        rWidth: im.rWidth,
        rHeight: im.rHeight,
        width: im.width,
        height: im.height,
        alt: im.filename,
        featured: im.featured
      });
    }
    setImages(tempImages);
  }, [content, resetter]);
  function handleDragStart(e, index) {
    e.dataTransfer.setData("text/plain", `${index}`);
    setIsDragging("dragging");
  }
  function handleDragEnd(e) {
    setIsDragging("");
  }
  function handleDrop(e, dropIndex) {
    e.preventDefault();
    let photoIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dropIndex !== photoIndex && dropIndex !== photoIndex + 1) {
      let tempImages = [...images];
      let image = tempImages[photoIndex];
      tempImages.splice(photoIndex, 1); // Remove the image at photoIndex
      tempImages.splice(dropIndex, 0, image); // Insert the removed image back into images at dropIndex
      setImages(tempImages);
    }
  }
  function MultipleFileForm({
    showID
  }) {
    const [multipleFiles, setMultipleFiles] = React.useState([]);
    const formRef = React.useRef();
    const progressRef = React.useRef();
    const etaRef = React.useRef();
    const filesRef = React.useRef();
    function handleMultipleFileSelect(e) {
      setMultipleFiles([...e.target.files]);
    }
    function uploadImage(e, file) {
      let formData = new FormData();
      formData.append('file', file);
      formData.append('show_id', showID);
      // return new Promise(resolve => setTimeout(resolve, 700));
      return fetch(e.target.form.action, {
        method: "POST",
        body: formData
      }).then(response => {
        return response.json();
      });
    }
    async function handleMultipleFileUpload(e, files) {
      e.preventDefault();
      formRef.current.classList.add("pending");
      let times = [];
      for (let i = 0; i < files.length; i++) {
        let start = performance.now();
        if (times.length) {
          let avgTime = times.reduce((a, b) => a + b) / (times.length * 1000.0);
          etaRef.current.innerHTML = `~${((files.length - times.length) * avgTime).toFixed(1)} seconds`;
        } else {
          etaRef.current.innerHTML = "∞";
        }
        let json = await uploadImage(e, files[i]);
        // if (json.code === 200) {
        // 	success.push(files[i])
        // } else {
        // 	failure.push(files[i])
        // }
        progressRef.current.value = i;
        times.push(performance.now() - start);
      }
      setMultipleFiles([]);
      filesRef.current.value = "";
      context.functions.refresh();
      formRef.current.classList.remove("pending");
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "multiFileFormContainer"
    }, /*#__PURE__*/React.createElement("form", {
      action: "/members/api/upload_show_image",
      ref: formRef,
      className: `multiFileForm`,
      method: "POST"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form"
    }, /*#__PURE__*/React.createElement("input", {
      type: "file",
      ref: filesRef,
      multiple: true,
      accept: "image/*",
      defaultValue: multipleFiles,
      onChange: handleMultipleFileSelect
    }), /*#__PURE__*/React.createElement(Input, {
      type: "submit",
      onClick: e => {
        handleMultipleFileUpload(e, multipleFiles);
      },
      value: "Submit"
    })), /*#__PURE__*/React.createElement("div", {
      className: "loader"
    })), /*#__PURE__*/React.createElement("div", {
      className: "progress"
    }, /*#__PURE__*/React.createElement("progress", {
      ref: progressRef,
      max: multipleFiles.length,
      value: 0
    }), /*#__PURE__*/React.createElement("span", {
      className: "eta",
      ref: etaRef
    }, "\u221E")));
  }
  function apply() {
    let dataImages = [];
    for (let i = 0; i < images.length; i++) {
      dataImages.push({
        id: images[i].id,
        order_value: i,
        featured: images[i].featured
      });
    }
    fetch("/members/api/set_show_images_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dataImages)
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        reset();
      }
    });
  }
  function reset() {
    context.functions.refresh();
    setResetter(resetter + 1);
  }
  function featuredToggle(index) {
    let tempImages = [...images];
    tempImages[index].featured = !tempImages[index].featured;
    setImages(tempImages);
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", null, content.title.replaceAll("_", " ")), /*#__PURE__*/React.createElement("div", {
    className: "photo_form"
  }, /*#__PURE__*/React.createElement(Tabs, null, /*#__PURE__*/React.createElement(Tab, {
    title: "Single Upload"
  }, /*#__PURE__*/React.createElement("form", {
    action: "/members/api/upload_show_image",
    method: "POST",
    onSubmit: handleFormSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("input", {
    type: "file",
    name: "file",
    accept: "image/*"
  }), /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "show_id",
    value: content.showID
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    value: "Upload"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }))), /*#__PURE__*/React.createElement(Tab, {
    title: "Bulk Upload"
  }, /*#__PURE__*/React.createElement(MultipleFileForm, {
    showID: content.showID
  })))), /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "button",
    onClick: apply
  }, "Apply"), /*#__PURE__*/React.createElement(Input, {
    type: "button",
    onClick: reset
  }, "Reset")), /*#__PURE__*/React.createElement("div", {
    className: `manage_show_images ${isDragging}`
  }, images.map((item, index) => /*#__PURE__*/React.createElement("div", {
    className: "arrange",
    key: index
  }, /*#__PURE__*/React.createElement("div", {
    className: "droppable",
    onDragOver: e => {
      e.preventDefault();
    },
    onDrop: e => {
      handleDrop(e, index);
    }
  }), /*#__PURE__*/React.createElement("div", {
    draggable: true,
    className: "draggable",
    onDragStart: e => {
      handleDragStart(e, index);
    },
    onDragEnd: handleDragEnd
  }, /*#__PURE__*/React.createElement("img", {
    draggable: false,
    src: item.src,
    alt: item.alt,
    width: item.rWidth,
    height: item.rHeight
  }), /*#__PURE__*/React.createElement(Icon, {
    className: item.featured ? "fill" : "",
    onClick: () => {
      featuredToggle(index);
    }
  }, "star")))), /*#__PURE__*/React.createElement("div", {
    className: "droppable",
    onDragOver: e => {
      e.preventDefault();
    },
    onDrop: e => {
      handleDrop(e, images.length);
    }
  })));
}

"use strict";

if (document.getElementById('alerts')) {
  const alertsRoot = ReactDOM.createRoot(document.getElementById('alerts'));
  if (globalInitialAlerts === undefined) {
    alertsRoot.render(/*#__PURE__*/React.createElement(AlertsContainer, null));
  } else {
    alertsRoot.render(/*#__PURE__*/React.createElement(AlertsContainer, {
      initialAlerts: globalInitialAlerts
    }));
  }
}
function displayAlerts(obj) {
  let newValue = JSON.stringify(obj);
  let input = document.querySelector('#AlertsContainerInput');
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeInputValueSetter.call(input, newValue);
  const event = new Event('input', {
    bubbles: true
  });
  input.dispatchEvent(event);
}
function AlertsContainer({
  initialAlerts = []
}) {
  let initialObj = {};
  let initialLength = 0;
  if (initialAlerts) {
    for (let i = 0; i < initialAlerts.length; i++) {
      initialObj[i] = {
        title: initialAlerts[i].title,
        content: initialAlerts[i].content
      };
      initialLength++;
    }
  }
  const [obj, setObj] = React.useState(initialObj);
  const [counter, setCounter] = React.useState(initialLength);
  function addNewAlert(key, title, content) {
    let newAlert = {};
    // let newKey = id(Date.now().toString())
    newAlert[key] = {
      title: title,
      content: content
    };
    setObj(obj => ({
      ...obj,
      ...newAlert
    }));
  }
  function handleNewAlerts(event) {
    console.log("alert?!");
    let newAlerts = JSON.parse(event.target.value);
    for (let i = 0; i < newAlerts.length; i++) {
      addNewAlert(counter + i, newAlerts[i].title, newAlerts[i].content);
    }
    setCounter(counter + newAlerts.length);
    event.target.value = "";
  }
  function handleAlertClose(id) {
    let copy = {
      ...obj
    };
    delete copy[id];
    setObj(obj => ({
      ...copy
    }));
  }
  function getAlerts() {
    let alerts = [];
    let entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i++) {
      let [key, value] = entries[i];
      alerts.push(/*#__PURE__*/React.createElement(Alert, {
        key: key,
        title: value.title,
        content: value.content,
        onAnimationEnd: () => {
          handleAlertClose(key);
        }
      }));
    }
    return alerts;
  }
  return /*#__PURE__*/React.createElement("div", {
    id: "alerts"
  }, getAlerts(), /*#__PURE__*/React.createElement("input", {
    id: "AlertsContainerInput",
    onChange: handleNewAlerts,
    hidden: true
  }));
}
function Alert({
  title,
  content,
  onAnimationEnd
}) {
  function handleBubble(event) {
    event.stopPropagation();
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "alert",
    onAnimationEnd: onAnimationEnd
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, title), /*#__PURE__*/React.createElement("p", null, content)), /*#__PURE__*/React.createElement("div", {
    className: "progress",
    onAnimationEnd: handleBubble
  }));
}

"use strict";

const ords = {
  1: 'st',
  2: 'nd',
  3: 'rd'
};
function getPerfDateString(perf_datetime) {
  let datetime = new Date(perf_datetime);
  let weekday = datetime.toDateString().slice(0, 3);
  let day = datetime.getDate();
  let ord_suffix = day < 31 ? ords[day % 20] || "th" : "st";
  let month = datetime.toLocaleString('default', {
    month: 'short'
  });
  let hour = datetime.getHours();
  let mins = datetime.getMinutes();
  let ap_m = ["am", "pm"][{
    false: 0,
    true: 1
  }[hour > 12]];
  return `${weekday} ${day}${ord_suffix} ${month} ${hour % 12}:${mins}${ap_m}`;
}
function ManageBookings({
  content
}) {
  const context = React.useContext(app);
  let seats_sat = 0;
  let seats_total = 0;
  let performances = [];
  // let mods = []
  const [mods, setMods] = React.useState([]);
  let items = [];
  let show_options = [];
  const [historicSales, setHistoricSales] = React.useState(/*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Please select a show...")));
  const [redrawInt, setRedrawInt] = React.useState(0);
  for (let i = 0; i < content.performances.length; i++) {
    let perf = content.performances[i];
    let sat = Object.values(perf.seat_assignments).length;
    let seats = perf.layout.rowCount * 12 - perf.layout.hiddenSeats.length;
    seats_sat += sat;
    seats_total += seats;
    performances.push(/*#__PURE__*/React.createElement("li", {
      key: i
    }, /*#__PURE__*/React.createElement(Link, {
      href: `/members/bookings/seating/${perf.id}`
    }, /*#__PURE__*/React.createElement("h2", null, getPerfDateString(perf.date)), /*#__PURE__*/React.createElement("h3", null, "Seats: ", sat, "/", seats, " (", perf.layout.newSeats, " new)"))));
  }
  React.useEffect(() => {
    let tempMods = [];
    for (let i = 0; i < content.mods.length; i++) {
      let mod = content.mods[i];
      tempMods.push(/*#__PURE__*/React.createElement("tr", {
        key: i
      }, /*#__PURE__*/React.createElement("td", {
        className: "info",
        title: mod.id
      }, /*#__PURE__*/React.createElement(Icon, {
        icon: "important"
      })), /*#__PURE__*/React.createElement("td", {
        className: "center"
      }, mod.ref), /*#__PURE__*/React.createElement("td", null, mod.from_item || ""), /*#__PURE__*/React.createElement("td", {
        className: "center"
      }, mod.change_quantity), /*#__PURE__*/React.createElement("td", {
        className: "wide"
      }, mod.to_item), /*#__PURE__*/React.createElement("td", null, mod.note || ""), /*#__PURE__*/React.createElement("td", {
        className: "center"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: mod.is_reservation ? "checked" : "",
        readOnly: true,
        onClick: e => {
          e.preventDefault();
        }
      })), /*#__PURE__*/React.createElement("td", {
        className: "center"
      }, /*#__PURE__*/React.createElement("a", {
        onClick: e => {
          deleteBookingMod(e, mod.id);
        }
      }, "Delete"))));
    }
    setMods([...tempMods]);
  }, [content]);
  for (let i = 0; i < content.items.length; i++) {
    let item = content.items[i];
    items.push(/*#__PURE__*/React.createElement("option", {
      key: i,
      value: item
    }, item));
  }
  for (let i = 0; i < content.past_shows.length; i++) {
    let show = content.past_shows[i];
    show_options.push(/*#__PURE__*/React.createElement("option", {
      key: show.id,
      value: show.id,
      selected: true
    }, show.title));
  }
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        context.functions.refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    }).finally(() => {
      form.classList.remove("pending");
      setRedrawInt(redrawInt + 1);
    });
  }
  function deleteBookingMod(e, modId) {
    e.preventDefault();
    fetch('/members/api/bookings/delete_booking_mod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: modId
      })
    }).then(response => response.json()).then(data => {
      if (data.code === 200) {
        displayAlerts([{
          title: `Success`,
          content: data.msg
        }]);
        context.functions.refresh(); // Refresh the content like in `handleFormSubmit`
      } else {
        console.error('Error deleting mod:', data.msg);
        displayAlerts([{
          title: `Error: ${data.code}`,
          content: data.msg
        }]);
      }
    }).catch(error => {
      console.error('Request error:', error);
    });
  }
  function getHistoricSales(e) {
    let form = e.target;
    form.classList.add("pending");
    let formData = {};
    for (let [key, value] of new FormData(form).entries()) {
      formData[key] = value;
      console.log(key, value);
    }
    e.preventDefault();
    fetch('/members/api/bookings/historic_sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(response => response.json()).then(data => {
      if (data.code === 200) {
        displayAlerts([{
          title: `Success`,
          content: data.msg
        }]);
        setHistoricSales(renderHistoricSales(data.results));
      } else {
        console.error('Error:', data.msg);
        displayAlerts([{
          title: `Error: ${data.code}`,
          content: data.msg
        }]);
      }
    }).catch(error => {
      console.error('Request error:', error);
    }).finally(() => {
      form.classList.remove("pending");
      setRedrawInt(redrawInt + 1);
    });
  }
  function monthStringToInt(month) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    // Normalize input to lowercase and search in the array
    const searchStr = month.toLowerCase().substring(0, 3);
    const index = months.indexOf(searchStr);
    // Add 1 because arrays are zero-based
    return index >= 0 ? index + 1 : null; // Return null if not found
  }
  function renderHistoricSales(results) {
    let tickets = [];
    let ticketsTotal = 0;
    let quantityTotal = 0;
    let discountTotal = 0;
    let keys = Object.keys(results.sums);
    for (let i = 0; i < keys.length; i++) {
      let [_, date, type] = keys[i].split(' - ');
      let [__, day, month, time] = date.split(" ");
      day = day.replace(/[^0-9 ]/g, "");
      if (date.slice(-2) === "pm") {
        time = String(parseInt(time.replace(/[^0-9 ]/g, "")) + 1200);
      }
      let sortValue = parseInt([String(monthStringToInt(month)).padStart(2, "0"), day.padStart(2, "0"), time.padStart(4, "0"), type.charCodeAt(0)].join(""));
      let obj = {
        sortValue: sortValue,
        date: date,
        type: type,
        sales: results.sums[keys[i]]
      };
      tickets.push(obj);
    }
    tickets.sort((a, b) => {
      return a.sortValue - b.sortValue;
    });
    let rows = [];
    let dupDateCount = 1;
    for (let i = tickets.length - 1; i >= 0; i--) {
      let salesKeys = Object.keys(tickets[i].sales);
      for (let j = 0; j < salesKeys.length; j++) {
        let price = salesKeys[j] / 100.0;
        let quantity = tickets[i].sales[salesKeys[j]].amount;
        let discounts = tickets[i].sales[salesKeys[j]].discounts / 100.0;
        let subtotal = parseInt(price) * parseInt(quantity);
        ticketsTotal = ticketsTotal + subtotal;
        discountTotal = discountTotal + discounts;
        quantityTotal = quantityTotal + quantity;
        let total = subtotal - discounts;
        let row = /*#__PURE__*/React.createElement("tr", null);
        if (i !== 0 && tickets[i].date === tickets[i - 1].date) {
          row = /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, tickets[i].type), /*#__PURE__*/React.createElement("td", null, quantity), /*#__PURE__*/React.createElement("td", null, "\xA3", price), /*#__PURE__*/React.createElement("td", null, "\xA3", subtotal), /*#__PURE__*/React.createElement("td", null, "\xA3", discounts), /*#__PURE__*/React.createElement("td", null, "\xA3", total));
          dupDateCount++;
        } else {
          row = /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
            rowSpan: dupDateCount
          }, tickets[i].date), /*#__PURE__*/React.createElement("td", null, tickets[i].type), /*#__PURE__*/React.createElement("td", null, quantity), /*#__PURE__*/React.createElement("td", null, "\xA3", price.toFixed(2)), /*#__PURE__*/React.createElement("td", null, "\xA3", subtotal.toFixed(2)), /*#__PURE__*/React.createElement("td", null, "\xA3", discounts.toFixed(2)), /*#__PURE__*/React.createElement("td", null, "\xA3", total.toFixed(2)));
          dupDateCount = 1;
        }
        rows.unshift(row);
      }
    }
    let grandTotal = ticketsTotal - discountTotal;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, results.showTitle), /*#__PURE__*/React.createElement("h3", null, "Tickets"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Quantity"), /*#__PURE__*/React.createElement("th", null, "Price"), /*#__PURE__*/React.createElement("th", null, "SubTotal"), /*#__PURE__*/React.createElement("th", null, "Discounts"), /*#__PURE__*/React.createElement("th", null, "Total"))), /*#__PURE__*/React.createElement("tbody", null, rows), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Total:"), /*#__PURE__*/React.createElement("th", null), /*#__PURE__*/React.createElement("th", null, quantityTotal), /*#__PURE__*/React.createElement("th", null), /*#__PURE__*/React.createElement("th", null, "\xA3", ticketsTotal.toFixed(2)), /*#__PURE__*/React.createElement("th", null, "\xA3", discountTotal.toFixed(2)), /*#__PURE__*/React.createElement("th", null, "\xA3", grandTotal.toFixed(2))))), /*#__PURE__*/React.createElement("h3", null, "Tickets Totals"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Card"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.totals.paid / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cash"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.totals.cash / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Refunds"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.totals.actual_refunds / 100).toFixed(2))), results.totals.expected_refunds !== results.totals.actual_refunds ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Expected Refunds"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.totals.expected_refunds / 100).toFixed(2))) : /*#__PURE__*/React.createElement(React.Fragment, null), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Fees"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.totals.fees / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Total"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.totals.net / 100).toFixed(2))))), /*#__PURE__*/React.createElement("h3", null, "Front of House"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Card Payments"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.foh_totals.paid / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Card Fees"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.foh_totals.fees / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Refunds"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.foh_totals.refunds / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cash"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.foh_totals.cash / 100).toFixed(2))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Total"), /*#__PURE__*/React.createElement("td", null, "\xA3", (results.foh_totals.net / 100).toFixed(2))))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("h3", null, mods.length), /*#__PURE__*/React.createElement(Tabs, {
    redrawInt: redrawInt
  }, /*#__PURE__*/React.createElement(Tab, {
    title: "Performances",
    redrawInt: redrawInt
  }, /*#__PURE__*/React.createElement("h2", null, "Performances: "), /*#__PURE__*/React.createElement("ul", null, performances), /*#__PURE__*/React.createElement("h3", null, "Total: ", seats_sat, "/", seats_total), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "Add Performance"), /*#__PURE__*/React.createElement("h2", null, "Add New Performance:"), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/bookings/add_new_performance",
    onSubmit: e => handleFormSubmit(e)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    id: "datetime",
    type: "datetime-local"
  }), /*#__PURE__*/React.createElement(Input, {
    id: "submit",
    type: "submit",
    value: "Add"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })))), /*#__PURE__*/React.createElement(Tab, {
    title: "All Bookings",
    redrawInt: redrawInt
  }, /*#__PURE__*/React.createElement(AllBookings, {
    show_name: "The Unexpected Guest"
  })), /*#__PURE__*/React.createElement(Tab, {
    title: "Modify Bookings",
    redrawInt: redrawInt
  }, /*#__PURE__*/React.createElement("h2", null, "Modify Bookings: "), /*#__PURE__*/React.createElement("table", {
    className: "mods"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "ID"), /*#__PURE__*/React.createElement("td", null, "Ref#"), /*#__PURE__*/React.createElement("td", null, "From"), /*#__PURE__*/React.createElement("td", null, "Quantity"), /*#__PURE__*/React.createElement("td", null, "New Item"), /*#__PURE__*/React.createElement("td", null, "Note"), /*#__PURE__*/React.createElement("td", null, "Reserved?"))), /*#__PURE__*/React.createElement("tbody", null, mods), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("input", {
    form: "add_mod",
    type: "number",
    name: "ref_num",
    placeholder: "#"
  })), /*#__PURE__*/React.createElement("td", {
    className: "wide"
  }, /*#__PURE__*/React.createElement("datalist", {
    id: "items_list"
  }, items), /*#__PURE__*/React.createElement("input", {
    form: "add_mod",
    type: "text",
    list: "items_list",
    name: "from_item",
    placeholder: "From (Name or Item)"
  })), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("input", {
    form: "add_mod",
    type: "number",
    min: "1",
    name: "change_quantity",
    defaultValue: "1"
  })), /*#__PURE__*/React.createElement("td", {
    className: "wide"
  }, /*#__PURE__*/React.createElement("select", {
    form: "add_mod",
    name: "to_item",
    required: true,
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "..."), items)), /*#__PURE__*/React.createElement("td", {
    className: "wide"
  }, /*#__PURE__*/React.createElement("input", {
    form: "add_mod",
    type: "text",
    name: "note"
  })), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("input", {
    form: "add_mod",
    type: "checkbox",
    name: "is_reservation"
  })), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("input", {
    form: "add_mod",
    type: "submit"
  }))))), /*#__PURE__*/React.createElement("form", {
    method: "POST",
    action: "/members/api/bookings/add_booking_mod",
    id: "add_mod",
    onSubmit: e => handleFormSubmit(e)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }))), /*#__PURE__*/React.createElement(Tab, {
    title: "Historic Sales",
    redrawInt: redrawInt
  }, /*#__PURE__*/React.createElement("form", {
    method: "POST",
    onSubmit: e => {
      getHistoricSales(e);
    },
    name: "historic_sales"
  }, /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }), /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement("select", {
    defaultValue: "",
    name: "showID"
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Select Show..."), show_options), /*#__PURE__*/React.createElement("input", {
    type: "submit",
    value: "Submit"
  }), /*#__PURE__*/React.createElement("div", {
    className: "data"
  }, historicSales))))));
}
function AllBookings({
  show_name
}) {
  const [bookings, setBookings] = React.useState([]);
  React.useEffect(() => {
    fetch(`/members/api/orders/${show_name}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json()).then(data => {
      let tempBookings = [];
      let perfs = Object.keys(data);
      for (let i = 0; i < perfs.length; i++) {
        let order_ids = Object.keys(data[perfs[i]]);
        for (let j = 0; j < order_ids.length; j++) {
          let tempBooking = {
            ...data[perfs[i]][order_ids[j]],
            perf_date: perfs[i]
          };
          tempBookings.push(tempBooking);
        }
      }
      tempBookings.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      setBookings(tempBookings.filter(booking => booking.tickets_count).map((booking, i) => /*#__PURE__*/React.createElement(OrderListItem, {
        key: `${i}`,
        order: booking
      })));
    });
  }, []);
  return /*#__PURE__*/React.createElement("div", null, bookings);
}
function OrderListItem({
  order
}) {
  // Use the existing date formatting function
  const formattedDate = new Date(order.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
  // Format tickets display const ticketItems = Object.entries(order.tickets) .map(([type, count]) => `${type}: ${count}`) .join(', ')
  let date_array = order.perf_date.split(" ");
  delete date_array[2];
  function handlePreviewReceipt(order) {
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    window.open(`/members/bookings/receipt/${order.show_id}/${order.ref}`, 'receiptPreview', features);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "order_card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "order_main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, order.name), /*#__PURE__*/React.createElement("div", {
    className: "date"
  }, "\uD83D\uDCC5 ", formattedDate), /*#__PURE__*/React.createElement("div", {
    className: "ref"
  }, "\uD83D\uDCDD Ref: ", order.ref)), /*#__PURE__*/React.createElement("div", {
    className: "order_details"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "ticket_list"
  }, /*#__PURE__*/React.createElement("li", {
    className: "date"
  }, date_array.join(" ")), Object.entries(order.tickets).filter(([type, count]) => count > 0).map(([type, count]) => /*#__PURE__*/React.createElement("li", {
    className: "tickets",
    key: type
  }, /*#__PURE__*/React.createElement("span", {
    className: "ticket-type"
  }, type), /*#__PURE__*/React.createElement("span", {
    className: "ticket_count"
  }, count))))), order.note && /*#__PURE__*/React.createElement("div", {
    className: "order_note"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, /*#__PURE__*/React.createElement(Icon, null, "docs"), " Note:"), /*#__PURE__*/React.createElement("span", {
    className: "note"
  }, order.note)), /*#__PURE__*/React.createElement("div", {
    className: "order_actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "withDropDown receipt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, /*#__PURE__*/React.createElement(Icon, null, "receipt_long"), /*#__PURE__*/React.createElement("span", null, "Receipt"), /*#__PURE__*/React.createElement(Icon, null, "arrow_drop_down")), /*#__PURE__*/React.createElement("div", {
    className: "dropdown"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handlePreviewReceipt(order),
    className: "btn_preview"
  }, /*#__PURE__*/React.createElement(Icon, null, "visibility"), " Preview Receipt"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendReceipt(order),
    className: "btn_send"
  }, /*#__PURE__*/React.createElement(Icon, null, "outgoing_mail"), " Send New Receipt"))), /*#__PURE__*/React.createElement("div", {
    className: "withDropDown mods"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, /*#__PURE__*/React.createElement(Icon, null, "edit"), /*#__PURE__*/React.createElement("span", null, "Modify"), /*#__PURE__*/React.createElement(Icon, null, "arrow_drop_down")), /*#__PURE__*/React.createElement("div", {
    className: "dropdown"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handlePreviewReceipt(order),
    className: "btn_preview"
  }, /*#__PURE__*/React.createElement(Icon, null, "event_upcoming"), " Move Tickets"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendReceipt(order),
    className: "btn_send"
  }, /*#__PURE__*/React.createElement(Icon, null, "event_busy"), "Mark Refunded"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleAddModification(order),
    className: "btn_modify"
  }, "\u270F\uFE0F Add Modification")))));
}

"use strict";

function Carousel5({
  photos,
  showTitle
}) {
  const [currentOffset, setCurrentOffset] = React.useState(0);
  let count = 5;
  let photoElems = [];
  for (let i = 0; i < photos.length; i++) {
    photoElems.push(/*#__PURE__*/React.createElement("div", {
      className: "react-carousel-item",
      "data-position": `${(i + currentOffset) % count + 1}`,
      key: i,
      style: {
        gridArea: `${String.fromCharCode(64 + (i + currentOffset) % count + 1)}`
      }
    }, /*#__PURE__*/React.createElement(Image, {
      id: `photo${i + currentOffset}`,
      src: photos[i],
      alt: `Photo from ${showTitle}`
    })));
  }
  function handleTransitionEnd() {
    setCurrentOffset(currentOffset + 1);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "react-carousel"
  }, /*#__PURE__*/React.createElement("div", {
    className: `react-carousel-inner transition${["A", "B"][currentOffset % 2]}`,
    onAnimationEnd: handleTransitionEnd
  }, photoElems));
}

"use strict";

function FaceDetection({
  content
}) {
  const context = React.useContext(app);
  const [faces, setFaces] = React.useState([]);
  const [faceForms, setFaceForms] = React.useState([]);
  const [faceBoxes, setFaceBoxes] = React.useState([]);
  const [i, setI] = React.useState(0);
  const [reRender, setReRender] = React.useState(false);
  const [members, setMembers] = React.useState([]);
  const [nullFaces, setNullFaces] = React.useState([]);
  React.useEffect(() => {
    let keys = Object.keys(content.members);
    let tempMembers = [];
    for (let x = 0; x < keys.length; x++) {
      let key = keys[x];
      tempMembers.push({
        value: key,
        text: content.members[key].name,
        group: content.members[key].group
      });
    }
    setMembers(tempMembers);
  }, []);
  React.useEffect(() => {
    fetch("/api/getSavedFaces", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        photoID: content.photos[i].id
      })
    }).then(response => {
      return response.json();
    }).then(data => {
      setFaces(data);
      setFaceForms([]);
      setFaceBoxes([]);
    });
  }, [i, reRender]);
  function FaceForm({
    face,
    j,
    idStart = "faceID",
    isNullFace = false
  }) {
    let k = i;
    if (isNullFace) {
      k = content.photos.findIndex(el => {
        return el.id === face.photo_id;
      });
    }
    const photoWidth = content.photos[k].width;
    const photoHeight = content.photos[k].height;
    const bgPosX = content.photos[i].width - face.w === 0 ? '0%' : `${face.x / (content.photos[i].width - face.w) * -100}%`;
    const bgPosY = content.photos[i].height - face.h === 0 ? '0%' : `${face.y / (content.photos[i].height - face.h) * -100}%`;
    let faceStyle = {
      position: "absolute",
      width: `${photoWidth / face.w * 100}%`,
      height: `${photoHeight / face.h * 100}%`,
      top: `-${face.y / face.h * 100}%`,
      left: `-${face.x / face.w * 100}%`
    };
    function saveFace() {
      fetch("/api/setFaceMember", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          faceID: face.id,
          memberID: document.getElementById(`${idStart}${j}`).value
        })
      });
    }
    function deleteFace() {
      fetch("/api/deleteFace", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          faceID: face.id
        })
      }).then(() => {
        setReRender(!reRender);
      });
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "faceForm",
      style: {
        order: face.x
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "face"
    }, /*#__PURE__*/React.createElement("img", {
      style: faceStyle,
      src: `/photo_new/${face.photo_id}`,
      alt: "Cropped face"
    })), /*#__PURE__*/React.createElement(Select, {
      id: `${idStart}${j}`,
      placeholder: "Select Member",
      create: false,
      setSelected: v => {},
      maxItems: 1,
      selected: face.member_id || "",
      options: members,
      optgroups: [{
        value: "cast",
        label: "Cast"
      }, {
        value: "crew",
        label: "Crew"
      }]
    }), /*#__PURE__*/React.createElement("div", {
      className: "buttons"
    }, /*#__PURE__*/React.createElement(Input, {
      type: "button",
      onClick: saveFace
    }, /*#__PURE__*/React.createElement(Icon, null, "save")), /*#__PURE__*/React.createElement(Input, {
      type: "button",
      onClick: deleteFace
    }, /*#__PURE__*/React.createElement(Icon, null, "delete"))));
  }
  function detectFaces(e, fullRes = false) {
    fetch(`/api/face_detection/analyse${fullRes ? "?fullRes=true" : ""}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        photoID: content.photos[i].id
      })
    }).then(() => {
      setReRender(!reRender);
      // context.functions.refresh(false)
    });
  }
  React.useEffect(() => {
    let tempFaceForms = [];
    let tempFaceBoxes = [];
    let width = content.photos[i].width;
    let height = content.photos[i].height;
    for (let j = 0; j < faces.length; j++) {
      tempFaceForms.push(/*#__PURE__*/React.createElement(FaceForm, {
        key: j,
        j: j,
        idStart: "faceID",
        face: faces[j]
      }));
      tempFaceBoxes.push(/*#__PURE__*/React.createElement("div", {
        key: `${i}_${j}`,
        className: "face_marker_outer",
        style: {
          left: `${100 * faces[j].x / width}%`,
          top: `${100 * faces[j].y / height}%`
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "face_marker",
        style: {
          width: `${100 * faces[j].w / width}%`,
          height: `${100 * faces[j].h / height}%`
        }
      })));
    }
    setFaceForms(tempFaceForms);
    setFaceBoxes(tempFaceBoxes);
  }, [faces]);
  function prev() {
    // console.log(content.photos.length)
    // console.log((i - 1 + content.photos.length) % content.photos.length)
    setI((i - 1 + content.photos.length) % content.photos.length);
  }
  function next() {
    setI((i + 1) % content.photos.length);
  }
  function getNullFaces() {
    fetch("/api/getNullFaces", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        showID: content.showID
      })
    }).then(response => {
      return response.json();
    }).then(data => {
      let tempNullFaces = [];
      for (let x = 0; x < data.length; x++) {
        tempNullFaces.push(/*#__PURE__*/React.createElement(FaceForm, {
          key: x,
          idStart: "NullFaceID",
          face: data[x],
          j: x,
          isNullFace: true
        }));
      }
      setNullFaces(tempNullFaces);
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "faceDetection"
  }, /*#__PURE__*/React.createElement("h2", null, "Face Detection"), /*#__PURE__*/React.createElement("h3", null, i, "/", content.photos.length), /*#__PURE__*/React.createElement("div", {
    className: "null faces"
  }, /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", {
    onClick: getNullFaces
  }, "Null Faces"), nullFaces)), /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "button",
    onClick: prev
  }, "Prev"), /*#__PURE__*/React.createElement(Input, {
    type: "button",
    onClick: detectFaces
  }, "Detect Faces"), /*#__PURE__*/React.createElement(Input, {
    type: "button",
    onClick: e => {
      detectFaces(e, true);
    }
  }, "Detect FullRes"), /*#__PURE__*/React.createElement(Input, {
    type: "button",
    onClick: next
  }, "Next")), /*#__PURE__*/React.createElement("div", {
    className: `faces ${reRender}`
  }, faceForms), /*#__PURE__*/React.createElement("div", {
    className: "img"
  }, /*#__PURE__*/React.createElement("img", {
    style: {
      width: "100%"
    },
    id: "imageID",
    src: `/photo_new/${content.photos[i].id}`,
    alt: content.photos[i].filename,
    width: content.photos[i].width,
    height: content.photos[i].height
  }), faceBoxes));
}

"use strict";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// import { Icon } from "./icon"

// const dims = [...imageDims]
const lazyLoadDistance = 5;
const gallery = document.getElementById('gallery');
if (gallery) {
  const root = ReactDOM.createRoot(gallery);
  root.render(/*#__PURE__*/React.createElement(Gallery, {
    imageLinks: galleryImages
  }));
}
function Gallery({
  imageLinks,
  faces = {},
  type = "images"
}) {
  const [showFaces, setShowFaces] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(false);
  const images = [];
  for (let i = 0; i < imageLinks.length; i++) {
    let classname = "img-hidden";
    let load = false;
    let shown = false;
    if (i === 0) {
      classname = "";
      shown = true;
    }
    if (i < 0 + lazyLoadDistance || i > imageLinks.length - 0 - lazyLoadDistance) {
      load = true;
    }
    if (type === "images") {
      // faces={faces[imageLinks[i].id]} vv
      images.push(/*#__PURE__*/React.createElement(Image, {
        src: imageLinks[i].src,
        faces: faces[imageLinks[i].id] ?? [],
        showFaces: showFaces,
        shown: shown,
        width: imageLinks[i].width,
        height: imageLinks[i].height,
        key: i,
        i: i,
        alt: "Test",
        className: classname,
        load: load,
        inGallery: true
      }));
    } else if (type === "videos") {
      images.push(/*#__PURE__*/React.createElement(Video, {
        src: imageLinks[i][0],
        key: i,
        className: classname,
        i: i,
        inGallery: true
      }));
    }
  }
  const [imgNum, setImgNum] = React.useState(0);
  const [imageTags, setImageTags] = React.useState(images);
  const [fullscreen, setFullscreen] = React.useState(false);
  const galleryRef = React.createRef();
  const imagesRef = React.createRef();
  let swipeTouchStartX, swipeTouchStartY, swipeTouchStartT;
  let pinchTouchStartAX, pinchTouchStartAY, pinchTouchStartBX, pinchTouchStartBY, tempZoom, tempOffsetX, tempOffsetY;
  let currentZoom = 1;
  let currentOffsetX = 0;
  let currentOffsetY = 0;
  React.useEffect(() => {
    if (galleryRef && fullscreen) {
      galleryRef.current.focus();
    }
  }, [galleryRef, fullscreen]);

  // const max_dims =

  function incrImage(incr) {
    if (imageTags.length > 1) {
      let oldNum = wrapImgNum(imgNum);
      let newNum = wrapImgNum(imgNum + incr);
      let loadNum = wrapImgNum(imgNum + incr * lazyLoadDistance);
      let tagsCopy = [...imageTags];
      tagsCopy[oldNum] = /*#__PURE__*/React.createElement(Image, _extends({}, tagsCopy[oldNum].props, {
        showFaces: showFaces,
        key: oldNum,
        className: "img-hidden",
        shown: false
      }));
      tagsCopy[newNum] = /*#__PURE__*/React.createElement(Image, _extends({}, tagsCopy[newNum].props, {
        showFaces: showFaces,
        key: newNum,
        className: "",
        shown: true
      }));
      tagsCopy[loadNum] = /*#__PURE__*/React.createElement(Image, _extends({}, tagsCopy[loadNum].props, {
        showFaces: showFaces,
        key: loadNum,
        load: true
      }));
      setShowGrid(false);
      setImgNum(newNum);
      setImageTags([...tagsCopy]);
      currentZoom = 1;
      currentOffsetX = 0;
      currentOffsetY = 0;
      imagesRef.current.style.transform = `scale(${currentZoom}) translate(${Math.trunc(currentOffsetX)}px, ${Math.trunc(currentOffsetY)}px)`;
    }
  }
  function changeImage(num) {
    if (imageTags.length > 1) {
      let oldNum = wrapImgNum(imgNum);
      let newNum = wrapImgNum(num);
      // let loadNum = wrapImgNum(imgNum + incr*lazyLoadDistance)
      let tagsCopy = [...imageTags];
      for (let i = num - lazyLoadDistance; i < num + lazyLoadDistance; i++) {
        let loadNum = wrapImgNum(i);
        tagsCopy[loadNum] = /*#__PURE__*/React.createElement(Image, _extends({}, tagsCopy[loadNum].props, {
          showFaces: showFaces,
          key: loadNum,
          load: true
        }));
      }
      tagsCopy[oldNum] = /*#__PURE__*/React.createElement(Image, _extends({}, tagsCopy[oldNum].props, {
        showFaces: showFaces,
        key: oldNum,
        className: "img-hidden",
        shown: false
      }));
      tagsCopy[newNum] = /*#__PURE__*/React.createElement(Image, _extends({}, tagsCopy[newNum].props, {
        showFaces: showFaces,
        key: newNum,
        load: true,
        className: "",
        shown: true
      }));
      setImgNum(newNum);
      setImageTags([...tagsCopy]);
      setShowGrid(false);
      currentZoom = 1;
      currentOffsetX = 0;
      currentOffsetY = 0;
      imagesRef.current.style.transform = `scale(${currentZoom}) translate(${Math.trunc(currentOffsetX)}px, ${Math.trunc(currentOffsetY)}px)`;
    }
  }
  function wrapImgNum(i) {
    if (i < 0) {
      return wrapImgNum(imageTags.length + i);
    } else {
      return i % imageTags.length;
    }
  }
  function toggleFullscreen() {
    setFullscreen(!fullscreen);
    if (fullscreen) {
      document.exitFullscreen().then();
    } else {
      document.body.requestFullscreen().then();
    }
  }
  function toggleGrid() {
    setShowGrid(!showGrid);
  }
  function handleKeyPress(event) {
    let keyMap = {
      ArrowLeft: -1,
      ArrowRight: 1
    };
    if (Object.keys(keyMap).includes(event.key)) {
      incrImage(keyMap[event.key]);
    }
  }
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      swipeTouchStartX = e.touches[0].pageX;
      swipeTouchStartY = e.touches[0].pageY;
      swipeTouchStartT = e.timeStamp;
    } else if (e.touches.length === 2) {
      [swipeTouchStartX, swipeTouchStartY, swipeTouchStartT] = [undefined, undefined, undefined];
      pinchTouchStartAX = e.touches[0].pageX;
      pinchTouchStartAY = e.touches[0].pageY;
      pinchTouchStartBX = e.touches[1].pageX;
      pinchTouchStartBY = e.touches[1].pageY;
    }
  }
  function handleTouchEnd(e) {
    if (swipeTouchStartX && swipeTouchStartY && swipeTouchStartT && !showGrid) {
      let changeX = e.changedTouches[0].pageX - swipeTouchStartX;
      let changeY = e.changedTouches[0].pageY - swipeTouchStartY;
      let changeT = e.timeStamp - swipeTouchStartT;
      let direction = changeX / Math.abs(changeX);
      let swipeFraction = Math.abs(changeX) / e.view.innerWidth;
      if (swipeFraction / changeT > 0.001) {
        incrImage(direction * -1);
      }
    }
    [swipeTouchStartX, swipeTouchStartY, swipeTouchStartT] = [undefined, undefined, undefined];
    currentZoom = tempZoom;
    currentOffsetX = tempOffsetX;
    currentOffsetY = tempOffsetY;
  }
  function handleZoom(e) {
    if (e.touches.length === 2) {
      // calculate zoom
      let startZoomDistance = Math.sqrt((pinchTouchStartAX - pinchTouchStartBX) ** 2 + (pinchTouchStartAY - pinchTouchStartBY) ** 2);
      let nowZoomDistance = Math.sqrt((e.touches[0].pageX - e.touches[1].pageX) ** 2 + (e.touches[0].pageY - e.touches[1].pageY) ** 2);
      tempZoom = currentZoom * nowZoomDistance / startZoomDistance;

      // calculate position
      tempOffsetX = (e.touches[0].pageX - pinchTouchStartAX + e.touches[1].pageX - pinchTouchStartBX) / 4 + currentOffsetX;
      tempOffsetY = (e.touches[0].pageY - pinchTouchStartAY + e.touches[1].pageY - pinchTouchStartBY) / 4 + currentOffsetY;

      // imagesRef.current.style.transform = `scale(${tempZoom})`
      imagesRef.current.style.transform = `scale(${tempZoom}) translate(${Math.trunc(tempOffsetX)}px, ${Math.trunc(tempOffsetY)}px)`;
    }
  }
  function toggleFaces() {
    console.log(!showFaces, "toggle faces");
    setShowFaces(!showFaces);
  }
  if (type === "images") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      ref: galleryRef,
      tabIndex: -1,
      className: "gallery-container " + ["", "fullscreen"][fullscreen * 1],
      onKeyUpCapture: e => handleKeyPress(e)
    }, /*#__PURE__*/React.createElement("div", {
      className: `gallery-images ${showFaces ? "faces" : ""}`,
      key: "gallery-images",
      ref: imagesRef,
      onTouchStart: event => handleTouchStart(event),
      onTouchMove: event => handleZoom(event),
      onTouchEnd: event => handleTouchEnd(event)
    }, imageTags, /*#__PURE__*/React.createElement("div", {
      className: `gallery-grid ${!showGrid && "hidden"}`
    }, imageLinks.map((image, index) => /*#__PURE__*/React.createElement("div", {
      key: index,
      className: "image_grid_item",
      onClick: () => changeImage(index)
    }, /*#__PURE__*/React.createElement("img", {
      src: `${image.src}?lowres`,
      alt: `Image ${index + 1}`,
      loading: "lazy"
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "gallery-controls"
    }, !!(faces && Object.keys(faces).length) && /*#__PURE__*/React.createElement("div", {
      className: "arrow faces",
      onClick: toggleFaces
    }, /*#__PURE__*/React.createElement(Icon, null, showFaces ? "face_retouching_off" : "face")), /*#__PURE__*/React.createElement("div", {
      className: "arrow",
      key: "gallery-arrow1",
      onClick: () => incrImage(-1)
    }, "<"), /*#__PURE__*/React.createElement("div", {
      className: "counter",
      key: "gallery-counter"
    }, /*#__PURE__*/React.createElement("span", null, imgNum + 1), /*#__PURE__*/React.createElement("span", null, "/", imageTags.length)), /*#__PURE__*/React.createElement("div", {
      className: "arrow",
      key: "gallery-arrow2",
      onClick: () => incrImage(1)
    }, ">"), /*#__PURE__*/React.createElement("div", {
      className: "arrow faces",
      key: "gallery-grid",
      onClick: toggleGrid
    }, /*#__PURE__*/React.createElement(Icon, {
      iconStyle: "sharp",
      className: "filled"
    }, ["grid_on", "image"][showGrid * 1])), /*#__PURE__*/React.createElement("div", {
      className: "arrow fullscreen",
      key: "gallery-fullscreen",
      onClick: toggleFullscreen
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: ["fullscreen", "fullscreen_exit"][fullscreen * 1]
    })))), /*#__PURE__*/React.createElement("p", {
      className: "mobile-instructions"
    }, "Pinch to zoom and pan, swipe to navigate between images."));
  } else if (type === "videos") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      ref: galleryRef,
      tabIndex: -1,
      className: "gallery-container " + ["", "fullscreen"][fullscreen * 1],
      onKeyUpCapture: e => handleKeyPress(e)
    }, /*#__PURE__*/React.createElement("div", {
      className: "gallery-images",
      key: "gallery-images",
      ref: imagesRef
    }, imageTags), /*#__PURE__*/React.createElement("div", {
      className: "gallery-controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "arrow",
      key: "gallery-arrow1",
      onClick: () => incrImage(-1)
    }, "<"), /*#__PURE__*/React.createElement("div", {
      className: "counter",
      key: "gallery-counter"
    }, /*#__PURE__*/React.createElement("span", null, imgNum + 1), /*#__PURE__*/React.createElement("span", null, "/", imageTags.length)), /*#__PURE__*/React.createElement("div", {
      className: "arrow",
      key: "gallery-arrow2",
      onClick: () => incrImage(1)
    }, ">"), /*#__PURE__*/React.createElement("div", {
      className: "arrow fullscreen",
      key: "gallery-fullscreen",
      onClick: toggleFullscreen
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: ["fullscreen", "fullscreen_exit"][fullscreen * 1]
    })))));
  }
}
function Image({
  src,
  alt,
  className,
  i,
  load = true,
  shown = true,
  showFaces = false,
  width,
  height,
  inGallery = false,
  title = "",
  faces = [],
  loading = "eager"
}) {
  let elemSrc = "";
  const [faceMarkers, setFaceMarkers] = React.useState([]);
  const markersRef = React.useRef([]);
  if (load) {
    elemSrc = src;
  }
  React.useEffect(() => {
    markersRef.current = markersRef.current.slice(0, faces.length);
  }, [faces]);
  React.useEffect(() => {
    if (faces.length > 0) {
      let markers = [];
      for (let i = 0; i < faces.length; i++) {
        markers.push(/*#__PURE__*/React.createElement("div", {
          key: i,
          ref: el => markersRef.current[i] = el,
          className: "face_marker_outer",
          style: {
            left: `${100 * faces[i].x / width}%`,
            top: `${100 * faces[i].y / height}%`
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "face_marker",
          style: {
            width: `${100 * faces[i].w / width}%`,
            height: `${100 * faces[i].h / height}%`
          }
        }), /*#__PURE__*/React.createElement("div", {
          className: "name",
          style: {
            left: `${100 * faces[i].w / width / 2}%`,
            top: "0px"
          }
        }, /*#__PURE__*/React.createElement("span", null, faces[i].name))));
      }
      setFaceMarkers(markers);
    }
  }, []);
  React.useLayoutEffect(() => {
    if (faces.length > 0 && markersRef.current.length > 0 && shown && showFaces) {
      // Collect all name elements with their bounding data.
      const nameData = markersRef.current.map(marker => {
        const nameEl = marker.querySelector('.name');
        if (!nameEl) return null;
        // Get current top value (if any) from computed style or fallback to 0.
        const computedTop = parseFloat(window.getComputedStyle(nameEl).top) || 0;
        return {
          element: nameEl,
          name: nameEl.querySelector('span').textContent,
          rect: nameEl.getBoundingClientRect(),
          originalTop: computedTop
        };
      }).filter(Boolean);

      // Build an overlap graph: each index represents an element.
      const graph = new Map();
      nameData.forEach((_, i) => graph.set(i, []));
      for (let i = 0; i < nameData.length; i++) {
        const a = nameData[i];
        for (let j = i + 1; j < nameData.length; j++) {
          const b = nameData[j];
          // If the two labels overlap...
          if (!(a.rect.right < b.rect.left || a.rect.left > b.rect.right || a.rect.bottom < b.rect.top || a.rect.top > b.rect.bottom)) {
            graph.get(i).push(j);
            graph.get(j).push(i);
          }
        }
      }

      // Use depth-first search (DFS) to group overlapping labels into clusters.
      const clusters = [];
      const visited = new Array(nameData.length).fill(false);
      for (let i = 0; i < nameData.length; i++) {
        if (!visited[i]) {
          const stack = [i];
          const cluster = [];
          visited[i] = true;
          while (stack.length) {
            const current = stack.pop();
            cluster.push(current);
            const neighbors = graph.get(current);
            for (const neighbor of neighbors) {
              if (!visited[neighbor]) {
                visited[neighbor] = true;
                stack.push(neighbor);
              }
            }
          }
          clusters.push(cluster);
        }
      }

      // Adjust the positions for each overlapping cluster.
      clusters.forEach(cluster => {
        if (cluster.length > 1) {
          // Get the elements for this cluster and sort them by their top coordinate.
          const clusterElements = cluster.map(i => nameData[i]);
          clusterElements.sort((a, b) => a.rect.y - b.rect.y);

          // Determine a gap between labels (you can adjust this value).
          const gap = 2;
          // Use the smallest original top as the starting point.
          const baseTop = clusterElements[0].originalTop;
          const topRect = clusterElements[0].rect;
          let topAdj = 0;

          // Position each element in the cluster to avoid overlapping.
          clusterElements.forEach((item, idx) => {
            // Here, we assume each label uses its own height from the bounding rect.
            // You may use a fixed height or different logic if needed.
            // let topAdj = 0
            let prev = clusterElements[idx - 1];
            if (idx === 0) {
              topAdj = 0;
            } else if (idx >= 1) {
              topAdj = topAdj + item.rect.height - Math.abs(item.rect.y - prev.rect.y) + gap;
            } else {
              // topAdj = item.rect.height + gap
            }
            const newTop = topAdj;
            item.element.style.top = `${newTop}px`;
          });
        }
      });
    }
  }, [shown, showFaces]);
  if (inGallery) {
    return (
      /*#__PURE__*/
      // <div key={"div" + i} style={{aspectRatio: width/height}}>
      // style={{aspectRatio: width/height}}            vvv
      React.createElement("div", {
        key: "div" + i,
        className: `img ${className}`
      }, /*#__PURE__*/React.createElement("img", {
        src: elemSrc,
        width: width,
        height: height,
        alt: alt,
        key: i
      }), /*#__PURE__*/React.createElement("div", {
        className: "face_markers",
        style: {
          aspectRatio: width / height
        }
      }, faceMarkers))
      // </div>
    );
  } else {
    return /*#__PURE__*/React.createElement("img", {
      src: elemSrc,
      width: width,
      height: height,
      alt: alt,
      key: i,
      className: className,
      title: title,
      loading: loading
    });
  }
}
function Video({
  src,
  className,
  i,
  alt = "",
  inGallery = false
}) {
  function refreshVideo(e) {
    if (!e.target.src.includes("?refresh")) {
      e.target.src = e.target.src + "?refresh";
    }
  }
  if (inGallery) {
    return /*#__PURE__*/React.createElement("div", {
      key: "div" + i
    }, /*#__PURE__*/React.createElement("video", {
      width: "100%",
      alt: alt,
      controls: true,
      className: className,
      onError: refreshVideo
    }, /*#__PURE__*/React.createElement("source", {
      src: src,
      type: "video/mp4"
    })));
  } else {
    return /*#__PURE__*/React.createElement("video", {
      key: i,
      width: "100%",
      alt: alt,
      controls: true,
      className: className,
      onError: refreshVideo
    }, /*#__PURE__*/React.createElement("source", {
      src: src,
      type: "video/mp4"
    }));
  }
}

"use strict";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const iconPaths = {
  admin: "M13 17C13 12 16 8 21 8S29 12 29 17 25 25 21 25 13 21 13 17M25 38C25 36 26 34 28 33V32C28 31 28 31 28 30 26 29 23 29 21 29 12 29 4 33 4 38V42H25V38M46 38V45C46 47 45 48 43 48H32C30 48 29 47 29 45V38C29 37 30 35 32 35V32C32 29 35 27 38 27 40 27 43 29 43 32V35C45 35 46 37 46 38M41 32C41 31 39 30 38 30 36 30 34 31 34 32V35H41V32Z",
  add: "M25 42C16 42 8 34 8 25 8 16 16 8 25 8 34 8 42 16 42 25 42 34 34 42 25 42M25 4A21 21 0 0 0 4 25 21 21 0 0 0 25 46 21 21 0 0 0 46 25 21 21 0 0 0 25 4M27 15H23V23H15V27H23V35H27V27H35V23H27V15Z",
  blog_icon: "m41.667 22.917h-33.333v-6.25h33.333m0 14.583h-14.583v-4.167h14.583m0 12.5h-14.583v-4.167h14.583m-18.75 4.167h-14.583v-12.5h14.583m19.437-17.354-3.458-3.479-3.479 3.479-3.479-3.479-3.458 3.479-3.479-3.479-3.479 3.479-3.458-3.479-3.479 3.479-3.479-3.479-3.458 3.479-3.479-3.479v33.333a4.167 4.167 0 0 0 4.167 4.167h33.333a4.167 4.167 0 0 0 4.167-4.167v-33.333l-3.479 3.479z",
  circle: "M25 15A10 10 0 0 0 15 25 10 10 0 0 0 25 35 10 10 0 0 0 35 25 10 10 0 0 0 25 15Z",
  copy_icon: "m41 44h-23v-29h23m0-4h-23a4 4 0 0 0-4 4v29a4 4 0 0 0 4 4h23a4 4 0 0 0 4-4v-29a4 4 0 0 0-4-4m-6-8h-25a4 4 0 0 0-4 4v29h4v-29h25v-4z",
  cross: "M5 5 45 45M5 45 45 5",
  dashboard: "M27 6V19H44V6M27 44H44V23H27M6 44H23V31H6M6 27H23V6H6V27Z",
  doc: "M29 4H12A4 4 0 0 0 8 8V42A4 4 0 0 0 12 46H38A4 4 0 0 0 42 42V17L29 4M32 42H29L25 27 21 42H18L14 23H17L20 37 24 23H26L30 37 33 23H36L32 42M27 19V7L39 19H27Z",
  drama: "M16.896 40.521C12.375 38.854 8.792 34.958 7.729 29.896L4.271 13.625C3.771 11.375 5.208 9.167 7.458 8.688L27.813 4.375 27.875 4.354C30.104 3.917 32.292 5.354 32.75 7.563L33.479 11.042 42.542 12.979H42.604C44.792 13.479 46.208 15.688 45.75 17.896L42.292 34.188C40.625 42.042 32.875 47.083 25 45.396 21.708 44.708 18.917 42.938 16.896 40.521V40.521M41.667 17.042 21.313 12.708 17.854 29V29.063C16.667 34.646 20.271 40.146 25.875 41.333 31.479 42.521 37.021 38.938 38.208 33.333L41.667 17.042M33.333 34.375C32.021 36.604 29.396 37.833 26.729 37.271 24.083 36.708 22.188 34.521 21.875 31.958L33.333 34.375M17.646 10.771 8.333 12.771 11.792 29.042 11.813 29.104C12.125 30.583 12.75 31.917 13.604 33.063 13.396 31.458 13.438 29.792 13.792 28.125L14.688 23.958C13.75 23.792 12.938 23.271 12.5 22.521 12.625 21.25 13.667 20.125 15.104 19.792 15.271 19.792 15.417 19.792 15.625 19.792L17.25 11.854C17.333 11.458 17.458 11.104 17.646 10.771M31.313 25.479C31.979 24.375 33.396 23.792 34.833 24.104 36.271 24.396 37.313 25.5 37.5 26.792 36.813 27.875 35.417 28.458 33.958 28.125 32.521 27.854 31.479 26.75 31.313 25.479M21.146 23.313C21.813 22.208 23.208 21.625 24.646 21.938 26.042 22.229 27.146 23.354 27.313 24.625 26.625 25.708 25.229 26.313 23.792 26.042 22.354 25.688 21.313 24.583 21.146 23.313M24.938 9.229 29.021 10.104 28.688 8.438 24.938 9.229Z",
  email_icon: "M50 14.583H45.833V27.083H50V14.583M50 31.25H45.833V35.417H50V31.25M41.667 12.5C41.667 10.208 39.792 8.333 37.5 8.333H4.167C1.875 8.333 0 10.208 0 12.5V37.5C0 39.792 1.875 41.667 4.167 41.667H37.5C39.792 41.667 41.667 39.792 41.667 37.5V12.5M37.5 12.5 20.833 22.917 4.167 12.5H37.5M37.5 37.5H4.167V16.667L20.833 27.083 37.5 16.667V37.5Z",
  eye: "M4.03 0c-2.53 0-4.03 3-4.03 3s1.5 3 4.03 3c2.47 0 3.97-3 3.97-3s-1.5-3-3.97-3zm-.03 1c1.11 0 2 .9 2 2 0 1.11-.89 2-2 2-1.1 0-2-.89-2-2 0-1.1.9-2 2-2zm0 1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1c0-.1-.04-.19-.06-.28-.08.16-.24.28-.44.28-.28 0-.5-.22-.5-.5 0-.2.12-.36.28-.44-.09-.03-.18-.06-.28-.06z",
  fb_icon: "M40,0H10C4.486,0,0,4.486,0,10v30c0,5.514,4.486,10,10,10h30c5.514,0,10-4.486,10-10V10C50,4.486,45.514,0,40,0z M39,17h-3 c-2.145,0-3,0.504-3,2v3h6l-1,6h-5v20h-7V28h-3v-6h3v-3c0-4.677,1.581-8,7-8c2.902,0,6,1,6,1V17z",
  file: "M27 19V7L39 19M12 4C10 4 8 6 8 8V42A4 4 0 0 0 12 46H37A4 4 0 0 0 42 42V17L29 4H12Z",
  filter: "m12.5 27.083h25v-4.167h-25m-6.25-10.417v4.167h37.5v-4.167m-22.917 25h8.333v-4.167h-8.333v4.167z",
  fullscreen: "m6.333 6.333h13.333v5.333h-8v8h-5.333v-13.833m24 0h13.333v13.333h-5.333v-8h-8v-5.833m8 24h5.333v13.333h-13.333v-5.333h8v-8.5m-18.667 8v5.333h-13.333v-13.333h5.333v8h8z",
  fullscreen_exit: "m30.333 30.333h13.333v5.333h-8v8h-5.333v-13.833m-24 0h13.333v13.333h-5.333v-8h-8v-5.833m8-24h5.333v13.333h-13.333v-5.333h8v-8.5m29.333 8v5.333h-13.333v-13.333h5.333v8h8z",
  help: "M23 38H27V33H23V38M25 13A8 8 0 0 0 17 21H21A4 4 0 0 1 25 17 4 4 0 0 1 29 21C29 25 23 24 23 31H27C27 27 33 26 33 21A8 8 0 0 0 25 13M10 6H40A4 4 0 0 1 44 10V40A4 4 0 0 1 40 44H10A4 4 0 0 1 6 40V10A4 4 0 0 1 10 6Z",
  ig_icon: "M 35.2059 0 H 14.9382 C 6.7012 0 0 6.7012 0 14.9382 v 20.2677 c 0 8.237 6.7012 14.9382 14.9382 14.9382 h 20.2677 c 8.237 0 14.9382 -6.7012 14.9382 -14.9382 V 14.9382 C 50.144 6.7012 43.4428 0 35.2059 0 z M 45.0996 35.2059 c 0 5.4641 -4.4296 9.8937 -9.8937 9.8937 H 14.9382 c -5.4641 0 -9.8937 -4.4296 -9.8937 -9.8937 V 14.9382 c 0 -5.4642 4.4296 -9.8937 9.8937 -9.8937 h 20.2677 c 5.4641 0 9.8937 4.4295 9.8937 9.8937 L 45.0996 35.2059 L 45.0996 35.2059 z M 25.072 12.103 C 17.9209 12.103 12.103 17.9209 12.103 25.072 s 5.8179 12.969 12.969 12.969 S 38.0411 32.2231 38.0411 25.072 S 32.2232 12.103 25.072 12.103 z M 25.072 32.9966 c -4.3766 0 -7.9246 -3.5479 -7.9246 -7.9246 s 3.548 -7.9246 7.9246 -7.9246 c 4.3766 0 7.9246 3.5479 7.9246 7.9246 C 32.9966 29.4486 29.4486 32.9966 25.072 32.9966 z M34.9233,12.1884a3.1045,3.1045 0 1,0 6.209,0a3.1045,3.1045 0 1,0 -6.209,0",
  important: "m27 27h-4v-13h4m0 21h-4v-4h4m-2-27a21 21 0 0 0-21 21 21 21 0 0 0 21 21 21 21 0 0 0 21-21 21 21 0 0 0-21-21z",
  logout: "M33 35V29H19V21H33V15L44 25 33 35M29 4A4 4 0 0 1 33 8V12H29V8H10V42H29V38H33V42A4 4 0 0 1 29 46H10A4 4 0 0 1 6 42V8A4 4 0 0 1 10 4H29Z",
  magnify: "M19.792 6.25A13.542 13.542 0 0 1 33.333 19.792C33.333 23.146 32.104 26.229 30.083 28.604L30.646 29.167H32.292L42.708 39.583 39.583 42.708 29.167 32.292V30.646L28.604 30.083C26.229 32.104 23.146 33.333 19.792 33.333A13.542 13.542 0 0 1 6.25 19.792 13.542 13.542 0 0 1 19.792 6.25M19.792 10.417C14.583 10.417 10.417 14.583 10.417 19.792 10.417 25 14.583 29.167 19.792 29.167 25 29.167 29.167 25 29.167 19.792 29.167 14.583 25 10.417 19.792 10.417Z",
  membership: "M41.667 4.167H8.333c-2.313 0-4.167 1.854-4.167 4.167v22.917c0 2.312 1.854 4.167 4.167 4.167h8.333v10.417l8.333-4.167 8.333 4.167v-10.417h8.333c2.313 0 4.167-1.854 4.167-4.167V8.333c0-2.313-1.854-4.167-4.167-4.167zm0 27.083H8.333v-4.167h33.333v4.167zm0-10.417H8.333V8.333h33.333v12.5z",
  msg: "M27 23H23V10H27M27 31H23V27H27M42 4H8C6 4 4 6 4 8V46L12 38H42C44 38 46 36 46 33V8C46 6 44 4 42 4Z",
  note: "M29 21H41L29 9V21M10 6H31L44 19V40A4 4 0 0 1 40 44H10C8 44 6 42 6 40V10C6 8 8 6 10 6M10 25V29H40V25H10M10 33V38H29V33H10Z",
  other_icon: "M 47.9375 12.14 L 37.845 2.05 c -0.7375 -0.7375 -2.0425 -0.7375 -2.78 0 L 21.87 15.245 c -0.7675 0.7675 -0.7675 2.0125 0 2.78 l 3.655 3.655 l -3.8325 3.8375 L 18.0375 21.865 c -0.7675 -0.7675 -2.0125 -0.7675 -2.78 0 l -13.195 13.19 c -0.7675 0.7675 -0.7675 2.0125 0 2.78 l 10.0925 10.0925 c 0.385 0.3825 0.8875 0.575 1.39 0.575 c 0.5025 0 1.0075 -0.1925 1.39 -0.575 l 13.2 -13.19 c 0.37 -0.37 0.575 -0.8675 0.575 -1.39 c 0 -0.5225 -0.2075 -1.0225 -0.575 -1.39 l -3.66 -3.66 l 3.8325 -3.8375 l 3.655 3.655 c 0.3825 0.3825 0.8875 0.575 1.39 0.575 c 0.5025 0 1.005 -0.1925 1.39 -0.575 l 13.195 -13.195 c 0.3675 -0.3675 0.575 -0.8675 0.575 -1.39 C 48.515 13.0075 48.305 12.51 47.9375 12.14 z M 23.9625 33.3475 l -10.4175 10.41 l -7.3125 -7.3125 l 10.415 -10.41 l 2.265 2.2625 l -1.675 1.67 c -0.7675 0.7675 -0.7675 2.0125 0 2.78 c 0.385 0.3825 0.89 0.575 1.39 0.575 c 0.5075 0 1.0075 -0.1925 1.39 -0.575 l 1.675 -1.67 L 23.9625 33.3475 z M 33.3525 23.945 l -2.265 -2.265 l 1.6575 -1.655 c 0.7675 -0.7675 0.7675 -2.0125 0 -2.78 c -0.7675 -0.7675 -2.0125 -0.7675 -2.78 0 L 28.305 18.9 l -2.265 -2.265 l 10.415 -10.415 l 7.3125 7.3125 L 33.3525 23.945 z",
  pdf: "M26.25 25.625H22.083V32.292H26.458C27.708 32.292 28.333 31.875 28.958 31.25 29.583 30.625 29.792 30 29.792 28.958 29.792 27.917 29.583 27.292 28.958 26.667 28.333 26.042 27.5 25.625 26.25 25.625M29.167 4.167H12.5A4.167 4.167 0 0 0 8.333 8.333V41.667A4.167 4.167 0 0 0 12.5 45.833H37.5A4.167 4.167 0 0 0 41.667 41.667V16.667L29.167 4.167M31.667 33.333C30.417 34.375 29.375 34.792 26.667 34.792H22.083V41.667H18.75V22.917H26.667C29.375 22.917 30.625 23.542 31.667 24.583 32.917 25.833 33.333 27.083 33.333 28.958 33.333 30.833 32.917 32.292 31.667 33.333M27.083 18.75V7.292L38.542 18.75H27.083Z",
  person: "m25 8a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8m0 21c9 0 17 4 17 8v4h-33v-4c0-5 7-8 17-8z",
  post: "M42 17 25 27 8 17V13L25 23 42 13M42 8H8C6 8 4 10 4 13V38A4 4 0 0 0 8 42H42A4 4 0 0 0 46 38V13C46 10 44 8 42 8Z",
  search: "M19.792 6.25A13.542 13.542 0 0 1 33.333 19.792C33.333 23.146 32.104 26.229 30.083 28.604L30.646 29.167H32.292L42.708 39.583 39.583 42.708 29.167 32.292V30.646L28.604 30.083C26.229 32.104 23.146 33.333 19.792 33.333A13.542 13.542 0 0 1 6.25 19.792 13.542 13.542 0 0 1 19.792 6.25M19.792 10.417C14.583 10.417 10.417 14.583 10.417 19.792 10.417 25 14.583 29.167 19.792 29.167 25 29.167 29.167 25 29.167 19.792 29.167 14.583 25 10.417 19.792 10.417Z",
  ticket: "m41.667 25c0-2.292 1.875-4.167 4.167-4.167v-8.333c0-2.292-1.875-4.167-4.167-4.167h-33.333c-2.292 0-4.146 1.875-4.146 4.167v8.333c2.292 0 4.146 1.875 4.146 4.167s-1.854 4.167-4.167 4.167v8.333c0 2.292 1.875 4.167 4.167 4.167h33.333c2.292 0 4.167-1.875 4.167-4.167v-8.333c-2.292 0-4.167-1.875-4.167-4.167zm-9.208 10-7.458-4.792-7.458 4.792 2.25-8.583-6.854-5.604 8.833-.521 3.229-8.208 3.208 8.229 8.833.521-6.854 5.604 2.271 8.563",
  trash: "M39.583 8.333H32.292L30.208 6.25H19.792L17.708 8.333H10.417V12.5H39.583M12.5 39.583A4.167 4.167 0 0 0 16.667 43.75H33.333A4.167 4.167 0 0 0 37.5 39.583V14.583H12.5V39.583Z",
  tw_icon: "M 44.71 14.75 c 0.02 0.44 0.03 0.87 0.03 1.32 c 0 13.5 -10.28 29.08 -29.08 29.08 c -5.77 0 -11.14 -1.69 -15.67 -4.59 c 0.8 0.09 1.62 0.14 2.44 0.14 c 4.79 0 9.19 -1.63 12.69 -4.37 c -4.47 -0.09 -8.24 -3.04 -9.54 -7.1 c 0.62 0.12 1.26 0.18 1.92 0.18 c 0.93 0 1.83 -0.12 2.69 -0.36 c -4.67 -0.94 -8.2 -5.07 -8.2 -10.02 c 0 -0.04 0 -0.09 0 -0.13 c 1.38 0.77 2.95 1.22 4.63 1.28 C 3.89 18.35 2.09 15.21 2.09 11.67 c 0 -1.87 0.5 -3.63 1.38 -5.14 c 5.04 6.18 12.57 10.25 21.06 10.68 c -0.17 -0.75 -0.26 -1.53 -0.26 -2.33 c 0 -5.64 4.57 -10.22 10.22 -10.22 c 2.94 0 5.59 1.24 7.45 3.22 c 2.33 -0.46 4.52 -1.31 6.49 -2.48 c -0.77 2.39 -2.38 4.39 -4.49 5.65 c 2.07 -0.24 4.04 -0.79 5.87 -1.61 C 48.44 11.5 46.7 13.3 44.71 14.75 z",
  xlsx: "m29 4h-17a4 4 0 0 0-4 4v33a4 4 0 0 0 4 4h25a4 4 0 0 0 4-4v-25l-12-12m4 37h-4l-4-7-4 7h-4l6-9-6-9h4l4 7 4-7h4l-6 9 6 9m-6-23v-11l11 11h-11z",
  sort_ascending: "M39.583 35.417H45.833L37.5 43.75 29.167 35.417H35.417V6.25H39.583M4.167 35.417H25V39.583H4.167M12.5 10.417V14.583H4.167V10.417M4.167 22.917H18.75V27.083H4.167V22.917Z",
  sort_descending: "M39.583 14.583H45.833L37.5 6.25 29.167 14.583H35.417V43.75H39.583M4.167 35.417H25V39.583H4.167M12.5 10.417V14.583H4.167V10.417M4.167 22.917H18.75V27.083H4.167V22.917Z",
  sort_alphabetical_ascending: "m39.583 35.417h6.25l-8.333 8.333-8.333-8.333h6.25v-29.167h4.167m-16.667 20.833v4.167l-6.937 8.333h6.938v4.167h-12.5v-4.167l6.938-8.333h-6.937v-4.167m8.333-20.833h-4.167c-2.292 0-4.167 1.875-4.167 4.167v12.5h4.167v-4.167h4.167v4.167h4.167v-12.5c0-2.292-1.854-4.167-4.167-4.167m0 8.333h-4.167v-4.167h4.167z",
  sort_alphabetical_descending: "m39.583 14.583h6.25l-8.333-8.333-8.333 8.333h6.25v29.167h4.167m-16.667-16.667v4.167l-6.937 8.333h6.938v4.167h-12.5v-4.167l6.938-8.333h-6.937v-4.167m8.333-20.833h-4.167c-2.292 0-4.167 1.875-4.167 4.167v12.5h4.167v-4.167h4.167v4.167h4.167v-12.5c0-2.292-1.854-4.167-4.167-4.167m0 8.333h-4.167v-4.167h4.167z",
  sort_clock_ascending: "M41.667 35.417H47.917L39.583 43.75 31.25 35.417H37.5V6.25H41.667V35.417M16.667 10.417C8.625 10.417 2.083 16.938 2.083 25 2.083 33.063 8.604 39.583 16.667 39.583 24.708 39.583 31.25 33.063 31.25 25 31.25 16.938 24.729 10.417 16.667 10.417M21.229 30.271 14.583 26.438V18.75H17.708V24.625L22.792 27.563 21.229 30.271Z",
  sort_clock_descending: "M37.5 14.583H31.25L39.583 6.25 47.917 14.583H41.667V43.75H37.5V14.583M16.667 10.417C8.625 10.417 2.083 16.938 2.083 25 2.083 33.063 8.604 39.583 16.667 39.583 24.708 39.583 31.25 33.063 31.25 25 31.25 16.938 24.729 10.417 16.667 10.417M21.229 30.271 14.583 26.438V18.75H17.708V24.625L22.792 27.563 21.229 30.271Z"
};
const iconRoots = [];
const tags = document.querySelectorAll('react-icon');
for (let i = 0; i < tags.length; i++) {
  let tag = tags[i];
  iconRoots.push(ReactDOM.createRoot(tag));
  iconRoots[i].render(/*#__PURE__*/React.createElement(Icon, {
    icon: tag.getAttribute('icon'),
    timeline: tag.getAttribute('timeline')
  }));
}
function Icon({
  icon = "",
  timeline,
  onClick,
  className = "",
  iconStyle = "outlined",
  tabIndex,
  children
}) {
  let opts = {};
  function handleEnter(e) {
    let keycode = e.keyCode ? e.keyCode : e.which;
    if (keycode === '13' || keycode === 13) {
      onClick();
    }
  }
  if (tabIndex !== undefined) {
    opts.tabIndex = tabIndex;
    opts.onKeyPress = handleEnter;
  }
  if (Object.keys(iconPaths).includes(icon) || icon === "siteLogo") {
    let d = iconPaths[icon];
    const context = React.useContext(app);
    if (icon === "siteLogo") {
      return /*#__PURE__*/React.createElement("span", _extends({}, opts, {
        className: "icon",
        onClick: onClick,
        dangerouslySetInnerHTML: {
          __html: context.siteJson.site_logo
        }
      }));
    }
    return /*#__PURE__*/React.createElement("svg", _extends({}, opts, {
      className: `icon ${className}`,
      viewBox: "0 0 50 50",
      onClick: onClick
    }), /*#__PURE__*/React.createElement("path", {
      d: d
    }), timeline === "up" ? /*#__PURE__*/React.createElement("path", {
      shapeRendering: "crispEdges",
      d: "m 24.5 5 l 0 -35 l 1 0 l 0 35 l -1 0 z"
    }) : null, timeline === "down" ? /*#__PURE__*/React.createElement("path", {
      shapeRendering: "crispEdges",
      d: "m 24.5 26 l 0 27 l 1 0 l 0 -27 l -1 0 z"
    }) : null);
  } else if (icon !== "") {
    return /*#__PURE__*/React.createElement("div", _extends({}, opts, {
      onClick: onClick,
      className: "react_icon"
    }), /*#__PURE__*/React.createElement("span", {
      className: `material-symbols-outlined ${className}`
    }, icon));
  } else {
    return /*#__PURE__*/React.createElement("div", _extends({}, opts, {
      onClick: onClick,
      className: "react_icon"
    }), /*#__PURE__*/React.createElement("span", {
      className: `material-symbols-${iconStyle} ${className}`
    }, children));
  }
}
function QRCode({
  data
}) {
  let rows = [];
  for (let i = 0; i < data.length; i++) {
    let row = [];
    for (let j = 0; j < data[i].length; j++) {
      row.push(/*#__PURE__*/React.createElement("span", {
        key: `${i} ${j}`,
        className: `cell ${data[i][j]}`
      }));
    }
    rows.push(/*#__PURE__*/React.createElement("div", {
      key: i,
      className: "row"
    }, row));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "qrcode"
  }, rows);
}

"use strict";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  type = "text",
  id,
  inputRef,
  onInput,
  onChange,
  onClick,
  value,
  label = "",
  required = false,
  stateful = false,
  children,
  className,
  form = "",
  maxLength = null
}) {
  const opts = {};
  if (type !== "password") {
    opts.placeholder = " ";
  }
  if (type === "submit" || stateful === true) {
    opts.value = value;
  } else {
    opts.defaultValue = value;
  }
  if (form !== "") {
    opts.form = form;
  }
  if (maxLength !== null) {
    opts.maxLength = maxLength;
  }
  if (type === "textarea") {
    return /*#__PURE__*/React.createElement("div", {
      className: "react-fancy-input"
    }, /*#__PURE__*/React.createElement("textarea", _extends({
      ref: inputRef,
      name: id
    }, opts, {
      onInput: onInput,
      onChange: onChange,
      required: required
    })), label ? /*#__PURE__*/React.createElement("label", {
      htmlFor: id
    }, label) : "");
  } else if (type === "button") {
    return /*#__PURE__*/React.createElement("div", {
      className: "react-fancy-input"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      id: id,
      className: className,
      onClick: onClick
    }, children));
  } else if (type === "select") {
    return /*#__PURE__*/React.createElement("div", {
      className: "react-fancy-input"
    }, /*#__PURE__*/React.createElement("select", _extends({
      ref: inputRef,
      id: id,
      name: id
    }, opts, {
      onInput: onInput,
      onChange: onChange,
      onClick: onClick,
      required: required
    }), children), label ? /*#__PURE__*/React.createElement("label", {
      htmlFor: id
    }, label) : "");
  } else {
    return /*#__PURE__*/React.createElement("div", {
      className: "react-fancy-input"
    }, /*#__PURE__*/React.createElement("input", _extends({
      ref: inputRef,
      className: className,
      id: id,
      name: id,
      type: type
    }, opts, {
      onInput: onInput,
      onChange: onChange,
      onClick: onClick,
      required: required
    })), label ? /*#__PURE__*/React.createElement("label", {
      htmlFor: id
    }, label) : "");
  }
}
function Select({
  id,
  children,
  placeholder,
  selected,
  setSelected,
  options = [],
  optgroups = [],
  create = true,
  maxItems = 200
}) {
  const ref = React.createRef();
  let currentSelection = [...selected];
  function onInit() {
    setTimeout(() => {
      document.getElementById(id).tomselect.blur();
      document.getElementById(id).tomselect.close();
    }, 100);
  }
  React.useEffect(() => {
    new TomSelect(`#${id}`, {
      maxItems: maxItems,
      allowEmptyOption: true,
      hidePlaceholder: true,
      openOnFocus: false,
      hideSelected: true,
      closeAfterSelect: maxItems === 1,
      items: currentSelection,
      options: options,
      optgroups: optgroups,
      optgroupField: "group",
      create: create,
      onItemAdd: function () {
        this.setTextboxValue('');
        this.refreshOptions();
        if (maxItems === 1) {
          this.blur();
          this.close();
        }
      },
      onChange: handleChange,
      onInitialize: onInit
    });
  }, []);
  React.useEffect(() => {
    let tempSelected = [...currentSelection];
    ref.current.tomselect.clearOptions();
    ref.current.tomselect.addOptions(options);
    ref.current.tomselect.refreshOptions();
    ref.current.tomselect.refreshItems();
    setSelected([...tempSelected]);
  }, [options]);
  React.useEffect(() => {
    if (currentSelection !== selected) {
      ref.current.tomselect.setValue(selected, true);
      currentSelection = selected;
    }
  }, [selected]);
  function handleChange(e) {
    if (e !== currentSelection) {
      currentSelection = [...e];
      setSelected([...e]);
    }
  }
  return /*#__PURE__*/React.createElement("select", {
    name: "",
    id: id,
    ref: ref,
    placeholder: placeholder
  }, children);
}
function Range({
  min,
  max,
  lowerVal,
  lowerValSetter,
  higherVal,
  higherValSetter
}) {
  function handleLowerChange(e) {
    lowerValSetter(e.target.value * -1);
  }
  function handleHigherChange(e) {
    higherValSetter(e.target.value * 1);
  }
  let halfwayA = Math.ceil((higherVal - lowerVal) / 2);
  let halfwayB = Math.floor((higherVal - lowerVal) / 2);
  let halfwayYearA = halfwayA + lowerVal;
  let halfwayYearB = halfwayB + lowerVal;
  return /*#__PURE__*/React.createElement("div", {
    className: "dual_range"
  }, lowerVal, "-", higherVal, /*#__PURE__*/React.createElement("div", {
    className: "sliders"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lower",
    style: {
      flexGrow: halfwayYearA - min
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "lower",
    min: halfwayYearA * -1,
    max: min * -1,
    step: 1,
    value: lowerVal * -1,
    onChange: handleLowerChange
  }), /*#__PURE__*/React.createElement("meter", {
    min: (halfwayYearA + 1) * -1,
    max: min * -1,
    value: lowerVal * -1
  })), /*#__PURE__*/React.createElement("div", {
    className: "higher",
    style: {
      flexGrow: max - halfwayYearB
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "higher",
    max: max,
    min: halfwayYearB,
    step: 1,
    value: higherVal,
    onChange: handleHigherChange
  }), /*#__PURE__*/React.createElement("meter", {
    min: halfwayYearB - 1,
    max: max,
    value: higherVal
  }))));
}

"use strict";

function Login({
  content
}) {
  const context = React.useContext(app);
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      // console.log("CODE: ", data.code)
      if (data.code === 200) {
        form.reset();
        context.functions.refresh(true);
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement(Tabs, null, /*#__PURE__*/React.createElement(Tab, {
    title: "Login"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login_form"
  }, /*#__PURE__*/React.createElement("form", {
    action: "/members",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement(Input, {
    key: "login_email",
    id: "email",
    label: "Email",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    key: "login_password",
    type: "password",
    id: "password",
    label: "Password",
    required: true
  }), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    key: "login_submit",
    type: "submit",
    value: "Login"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })))), /*#__PURE__*/React.createElement(Tab, {
    title: "Register"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login_form"
  }, /*#__PURE__*/React.createElement("form", {
    action: "/members/api/register"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement(Input, {
    key: "register_firstname",
    id: "firstname",
    label: "First Name",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    key: "register_lastname",
    id: "lastname",
    label: "Last Name",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    key: "register_email",
    id: "email",
    label: "Email",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    key: "register_password",
    type: "password",
    id: "password",
    label: "Password",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    key: "register_confirm_password",
    type: "password",
    id: "confirm_password",
    label: "Confirm Password",
    required: true
  }), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    key: "register_submit",
    type: "submit",
    value: "Register"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }))))), /*#__PURE__*/React.createElement(Files, {
    title: "Members Documents",
    files: content.files
  }, /*#__PURE__*/React.createElement(File, {
    href: "https://checkout.square.site/buy/2RAQ4QC2TWDCTY6WTQSAXZHG",
    subtext: "Click to pay.",
    key: "A",
    target: "_blank",
    fileType: "file",
    icon: "important"
  }, "Adult Membership Subs"), /*#__PURE__*/React.createElement(File, {
    href: "https://checkout.square.site/buy/PMRGF2GUVKGHNFZCOJMQQKXT",
    subtext: "Click to pay.",
    key: "J",
    target: "_blank",
    fileType: "file",
    icon: "important"
  }, "Junior Membership Subs")));
}

"use strict";

// TODO LIST
// TODO: refresh page on error unless recently refreshed.

function getID(a) {
  for (var b = 65521, c = 1, d = 0, e = 0, f; f = a.charCodeAt(e++); d = (d + c) % b) c = (c + f) % b;
  return d << 16 | c;
}
const md = new remarkable.Remarkable('full');
md.inline.ruler.enable(['footnote_inline', 'ins', 'mark', 'sub', 'sup']);
function MarkdownMedia({
  i,
  src,
  alt,
  title
}) {
  if (RegExp("/video/").test(src)) {
    return /*#__PURE__*/React.createElement(Video, {
      i: i,
      src: src,
      alt: alt,
      title: title
    });
  } else {
    return /*#__PURE__*/React.createElement(Image, {
      i: i,
      src: src,
      alt: alt,
      title: title
    });
  }
}
function preRenderMD(array = []) {
  let output = [];
  let openRegex = RegExp("(.*)_open$");
  let closeRegex = RegExp("(.*)_close$");
  let skipTo = 0;
  for (let i = 0; i < array.length; i++) {
    if (i >= skipTo) {
      let item = array[i];
      let level = item.level;
      let open_match = openRegex.exec(item.type);
      let copy = {
        ...item
      };
      delete copy["level"];
      delete copy["lines"];
      delete copy["type"];
      delete copy["tight"];
      delete copy["children"];
      if (open_match) {
        for (let j = i + 1; j < array.length; j++) {
          let close_match = closeRegex.exec(array[j].type);
          if (close_match && open_match[1] === close_match[1] && array[j].level === level) {
            skipTo = j + 1;
            output.push({
              type: open_match[1],
              children: preRenderMD(array.slice(i + 1, j)),
              ...copy
            });
            break;
          }
        }
      } else if (item.type === "inline") {
        output.push(...preRenderMD(item.children));
      } else {
        if (item.children) {
          output.push({
            type: item.type,
            ...copy,
            children: preRenderMD(item.children)
          });
        } else {
          output.push({
            type: item.type,
            ...copy
          });
        }
      }
    }
  }
  return output;
}
function codeCopy(codeId) {
  navigator.clipboard.writeText(document.getElementById(codeId).innerText);
}
function renderMD(array = []) {
  let output = [];
  let checked_box = RegExp("^\\[[xX]\\]");
  let unchecked_box = RegExp("^(\\[\\]|\\[ \\])");
  const tagTranslations = {
    paragraph: "p",
    ordered_list: "ol",
    bullet_list: "ul",
    list_item: "li",
    link: "a"
  };
  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    let tag = item.type;
    let props = {
      ...item
    };
    props.className = props.class;
    delete props["class"];
    delete props["type"];
    delete props["children"];
    if (item.type === "heading") {
      tag = "h" + item.hLevel;
      delete props["hLevel"];
    } else if (item.type === "text") {
      output.push(item.content);
      tag = "";
    } else if (item.type === "list_item") {
      if (item.children[0].type === "paragraph" && item.children[0].children[0].type === "text") {
        if (item.children[0].children[0].content.match(checked_box)) {
          item.children[0].class = "task_list_item";
          item.children[0].children[0].content = item.children[0].children[0].content.replace(checked_box, "");
          item.children[0].children.unshift({
            type: "checkbox",
            checked: true
          });
        } else if (item.children[0].children[0].content.match(unchecked_box)) {
          item.children[0].class = "task_list_item";
          item.children[0].children[0].content = item.children[0].children[0].content.replace(unchecked_box, "");
          item.children[0].children.unshift({
            type: "checkbox",
            checked: false
          });
        }
      }
    } else if (item.type === "checkbox") {
      tag = "";
      output.push(/*#__PURE__*/React.createElement("input", {
        className: "task_list_checkbox",
        type: "checkbox",
        disabled: true,
        defaultChecked: item.checked
      }));
    } else if (item.type === "image") {
      tag = "";
      output.push(/*#__PURE__*/React.createElement(MarkdownMedia, {
        i: item.src,
        src: item.src,
        alt: item.alt,
        title: item.title
      }));
    } else if (item.type === "code" || item.type === "fence") {
      tag = "";
      if (item.block || item.type === "fence") {
        let codeId = getID(String(item.content));
        output.push(/*#__PURE__*/React.createElement("pre", {
          key: `${codeId}_pre`
        }, /*#__PURE__*/React.createElement("div", {
          className: "code_header"
        }, /*#__PURE__*/React.createElement("span", {
          className: "code_language"
        }, item.params), /*#__PURE__*/React.createElement("span", {
          className: "copy_button",
          onClick: () => {
            codeCopy(codeId);
          }
        }, /*#__PURE__*/React.createElement("span", {
          className: "copy"
        }, "\uD83D\uDCCB Copy"), /*#__PURE__*/React.createElement("span", {
          className: "copied"
        }, "Copied!"))), /*#__PURE__*/React.createElement("code", {
          key: codeId,
          id: codeId
        }, item.content)));
      } else {
        output.push(/*#__PURE__*/React.createElement("code", {
          key: `output_${output.length}_${String(item.content).slice(0, 10)}`
        }, item.content));
      }
    } else if (item.type === "footnote_ref") {
      tag = "";
      let id;
      if (!item.subId) {
        id = `ref-${item.id + 1}`;
      } else {
        id = `ref-${item.id + 1}-${item.subId + 1}`;
      }
      output.push(/*#__PURE__*/React.createElement("sup", {
        key: `footref_${item.id + 1}`,
        id: id
      }, /*#__PURE__*/React.createElement("a", {
        href: `#footnote-${item.id + 1}`,
        key: `#footnote-${item.id + 1}`
      }, item.id + 1)));
    } else if (item.type === "footnote_block") {
      tag = "";
      output.push(/*#__PURE__*/React.createElement("section", {
        className: "footnotes",
        key: "#footnote-block"
      }, /*#__PURE__*/React.createElement("h3", null, "Footnotes"), /*#__PURE__*/React.createElement("ol", null, renderMD(item.children))));
    } else if (item.type === "footnote") {
      tag = "";
      let id;
      if (!item.subId) {
        id = `footnote-${item.id + 1}`;
      } else {
        id = `footnote-${item.id + 1}-${item.subId + 1}`;
      }
      output.push(/*#__PURE__*/React.createElement("li", {
        key: id,
        id: id
      }, /*#__PURE__*/React.createElement("div", {
        className: "marker"
      }), /*#__PURE__*/React.createElement("div", {
        className: "content"
      }, renderMD(item.children))));
    } else if (item.type === "footnote_anchor") {
      tag = "";
      let dest;
      let label;
      let sup = [];
      if (!item.subId) {
        dest = `#ref-${item.id + 1}`;
        label = `Back to reference ${item.id + 1}`;
      } else {
        dest = `#ref-${item.id + 1}-${item.subId + 1}`;
        label = `Back to reference ${item.id + 1}-${item.subId + 1}`;
        sup.push(/*#__PURE__*/React.createElement("sup", {
          key: `${dest}_sup`
        }, item.subId + 1));
      }
      output.push(/*#__PURE__*/React.createElement("a", {
        href: dest,
        key: dest,
        "aria-label": label
      }, "\u21A9", sup));
    } else if (item.type === "hardbreak" || item.type === "softbreak") {
      tag = "";
      output.push(" ");
    }
    if (Object.keys(tagTranslations).includes(item.type)) {
      tag = tagTranslations[item.type];
    }
    if (tag !== "") {
      output.push(React.createElement(tag, {
        ...props,
        key: `output_${output.length}_${String(item.content).slice(0, 10)}`
      }, ...renderMD(item.children)));
    }
  }
  return output;
}
function Markdown({
  className = "",
  content
}) {
  let parsed = md.parse(content, {});
  let preRendered = preRenderMD(parsed);
  let rendered = renderMD(preRendered);
  return /*#__PURE__*/React.createElement("div", {
    className: `markdown ${className}`
  }, rendered);
}

"use strict";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Dashboard({
  content
}) {
  let posts = [];
  let shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 0; i < content.posts.length; i++) {
    let post = content.posts[i];
    let date = new Date(post.date);
    let link = `/members/${post.type}/${post.id}${post.type === "file" ? "/" + post.title.replaceAll(" ", "_") : ""}`;
    let content_string = post.content;
    if (post.type === "file") {
      content_string = "";
    }
    posts.push(/*#__PURE__*/React.createElement(Link, {
      key: i,
      className: "post",
      href: link
    }, /*#__PURE__*/React.createElement("span", {
      className: "date"
    }, date.getDate(), "\xA0", shortMonths[date.getMonth()], /*#__PURE__*/React.createElement("br", null), date.getFullYear()), /*#__PURE__*/React.createElement(Icon, {
      icon: "msg",
      timeline: "up"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text"
    }, post.show_title ? /*#__PURE__*/React.createElement("span", {
      className: "show"
    }, post.show_title) : "", /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, /*#__PURE__*/React.createElement("h3", null, post.title)), /*#__PURE__*/React.createElement("span", {
      className: "text"
    }, /*#__PURE__*/React.createElement("span", null, content_string)))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
    className: "timeline"
  }, /*#__PURE__*/React.createElement("a", {
    href: "",
    className: "post heading"
  }, /*#__PURE__*/React.createElement("span", {
    className: "date"
  }), /*#__PURE__*/React.createElement(Icon, {
    icon: "circle",
    timeline: "down"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title"
  }, /*#__PURE__*/React.createElement("h2", null, "Recent")))), posts));
}
function MarkdownEditor({
  initialMarkdown = "",
  initialTitle = "",
  initialType = "",
  initialDate = "",
  show_title,
  show_id,
  post_id,
  modal = false,
  backCallback
}) {
  const mdeRef = React.useRef(0);
  const formRef = React.useRef(0);
  React.useEffect(() => {
    const easyMDE = new EasyMDE({
      element: mdeRef.current
    });
  }, []);
  function handleBack(e, refresh = false) {
    e.preventDefault();
    if (modal) {
      backCallback(refresh);
    } else {
      history.back();
    }
  }
  function handleSubmit(e) {
    e.preventDefault();
    let formData = new FormData(formRef.current);
    if (!post_id) {
      fetch(`/members/api/new_post/${show_id}`, {
        method: "POST",
        body: formData
      }).then(response => {
        return response.json();
      }).then(data => {
        if (data.code === 200) {
          handleBack(e, true);
        }
      });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("form", {
    action: "",
    onSubmit: handleSubmit,
    ref: formRef
  }, /*#__PURE__*/React.createElement("h3", {
    className: "details"
  }, /*#__PURE__*/React.createElement("a", {
    href: "",
    onClick: e => {
      handleBack(e);
    }
  }, "\u25C0 Back"), /*#__PURE__*/React.createElement("span", null, show_title), /*#__PURE__*/React.createElement("span", null, "")), /*#__PURE__*/React.createElement("div", {
    className: "react-fancy-input"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "title",
    placeholder: " ",
    defaultValue: initialTitle
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "title"
  }, "Title")), /*#__PURE__*/React.createElement("div", {
    className: "react-fancy-input"
  }, /*#__PURE__*/React.createElement("select", {
    name: "type",
    defaultValue: initialType
  }, /*#__PURE__*/React.createElement("option", {
    value: "public"
  }, "Public"), /*#__PURE__*/React.createElement("option", {
    value: "auditions"
  }, "Auditions"), /*#__PURE__*/React.createElement("option", {
    value: "private"
  }, "Private")), /*#__PURE__*/React.createElement("label", {
    htmlFor: "type"
  }, "Post Type")), /*#__PURE__*/React.createElement("div", {
    className: "react-fancy-input"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    name: "date",
    id: "date",
    defaultValue: initialDate,
    required: true
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "type"
  }, "Publish Date")), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("textarea", {
    ref: mdeRef,
    id: "wysiwyg",
    name: "content",
    defaultValue: initialMarkdown
  }), /*#__PURE__*/React.createElement("div", {
    className: "react-fancy-input"
  }, /*#__PURE__*/React.createElement("input", {
    type: "submit",
    value: "Submit"
  }))));
}
function Shows({
  content
}) {
  let shows = [];
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for (let i = 0; i < content.shows.length; i++) {
    let show = content.shows[i];
    let date = new Date(show.date);
    let image;
    if (show.image) {
      image = /*#__PURE__*/React.createElement("img", {
        src: show.image,
        alt: show.title + " programme cover"
      });
    } else {
      image = /*#__PURE__*/React.createElement(Icon, {
        icon: "siteLogo"
      });
    }
    shows.push(/*#__PURE__*/React.createElement(Link, {
      key: i,
      href: show.url,
      title: show.title,
      className: "show"
    }, /*#__PURE__*/React.createElement("div", null, image), /*#__PURE__*/React.createElement("div", {
      className: "details"
    }, /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, show.title), /*#__PURE__*/React.createElement("span", null, show.season, " ", date.getFullYear()), /*#__PURE__*/React.createElement("span", null, show.directors.join(", ")))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h2", null, content.title), shows);
}
function Show({
  content,
  refresh
}) {
  let posts = [];
  let files = [];
  let shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const context = React.useContext(app);
  const uploadRef = React.useRef(0);
  const [uploadFiles, setUploadFiles] = React.useState([]);
  const [postEditor, setPostEditor] = React.useState(false);
  const handleClick = React.useCallback(() => uploadRef.current.click(), []);
  if (content.posts) {
    for (let i = 0; i < content.posts.length; i++) {
      let post = content.posts[i];
      let date = new Date(post.date);
      let link = `/members/${post.type}/${post.id}${post.type === "file" ? "/" + post.title.replaceAll(" ", "_") : ""}`;
      let content_string = post.content;
      if (post.type === "file") {
        content_string = "";
      }
      posts.push(/*#__PURE__*/React.createElement(Link, {
        key: i,
        className: "post",
        href: link
      }, /*#__PURE__*/React.createElement("span", {
        className: "date"
      }, date.getDate(), "\xA0", shortMonths[date.getMonth()], /*#__PURE__*/React.createElement("br", null), date.getFullYear()), /*#__PURE__*/React.createElement(Icon, {
        icon: "msg",
        timeline: "up"
      }), /*#__PURE__*/React.createElement("div", {
        className: "text"
      }, post.show_title ? /*#__PURE__*/React.createElement("span", {
        className: "show"
      }, post.show_title) : "", /*#__PURE__*/React.createElement("span", {
        className: "title"
      }, /*#__PURE__*/React.createElement("h3", null, post.title)), /*#__PURE__*/React.createElement("span", {
        className: "text"
      }, /*#__PURE__*/React.createElement("span", null, content_string)))));
    }
  }
  if (content.files) {
    for (let i = 0; i < content.files.length; i++) {
      let file = content.files[i];
      let link = `/members/file/${file.id}/${file.title.replaceAll(" ", "_")}`;
      files.push(/*#__PURE__*/React.createElement("div", {
        key: i,
        className: "file",
        id: file.id
      }, /*#__PURE__*/React.createElement("div", {
        className: "loader"
      }), /*#__PURE__*/React.createElement(Link, {
        href: link,
        className: "icon"
      }, /*#__PURE__*/React.createElement(Icon, {
        icon: "pdf"
      })), /*#__PURE__*/React.createElement(Link, {
        href: link,
        className: "filetext"
      }, /*#__PURE__*/React.createElement("span", {
        className: "title"
      }, /*#__PURE__*/React.createElement("h4", null, file.title))), context.siteJson.current_user.is_authenticated && ((content.directors || []).includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ? /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: event => handleFileDelete(event, `${file.id}`),
        className: "delete"
      }, /*#__PURE__*/React.createElement("span", {
        className: "delete"
      }, "Delete?")) : ""));
    }
  }
  if (content.directors === undefined) {
    content.directors = [];
  }
  function handleFileDrop(event) {
    console.log("File(s) dropped");
    event.preventDefault();
    uploadRef.current.files = event.dataTransfer.files;
    let files = [];
    // Use DataTransfer interface to access the file(s)
    [...event.dataTransfer.files].forEach((file, i) => {
      console.log(`… file[${i}].name = ${file.name}`);
      files.push(/*#__PURE__*/React.createElement("span", {
        key: i
      }, file.name));
    });
    setUploadFiles([...files]);
  }
  function handleFileSelect() {
    let files = [];
    [...uploadRef.current.files].forEach((file, i) => {
      files.push(/*#__PURE__*/React.createElement("span", {
        key: i
      }, file.name));
    });
    setUploadFiles([...files]);
  }
  function handleUpload(event) {
    event.preventDefault();
    let formData = new FormData(uploadRef.current.form);
    uploadRef.current.form.classList.toggle("pending");
    fetch(`/members/api/upload_file/${content.id}`, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      console.log(data);
      uploadRef.current.form.reset();
      setUploadFiles([]);
      refresh(content.requestURL);
      uploadRef.current.form.classList.toggle("pending");
    });
  }
  function handleFileDelete(event, file_id) {
    event.preventDefault();
    document.getElementById(file_id).classList.toggle("pending");
    fetch(`/members/api/delete_file/${file_id}`, {
      method: "GET"
    }).then(response => {
      return response.json();
    }).then(data => {
      refresh(content.requestURL);
      document.getElementById(file_id).classList.toggle("pending");
    });
  }
  function handleNewPostClick(event) {
    event.preventDefault();
    setPostEditor(true);
  }
  function editorBackCallback(doRefresh) {
    if (doRefresh) {
      refresh(content.requestURL);
    }
    setPostEditor(false);
  }
  if (postEditor) {
    return /*#__PURE__*/React.createElement(MarkdownEditor, {
      show_id: content.id,
      show_title: content.title,
      modal: true,
      backCallback: editorBackCallback
    });
  } else {
    return /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("h1", null, content.title), context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ? /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "Manage Show (Click to show)"), /*#__PURE__*/React.createElement("div", {
      className: "manage"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form"
    }, /*#__PURE__*/React.createElement("h3", null, "Emergency Contacts"), /*#__PURE__*/React.createElement("p", null, "Warning: This is for genuine emergency use only. ", /*#__PURE__*/React.createElement("br", null), "All access will be logged and reported to the devs and committee."), /*#__PURE__*/React.createElement("div", {
      className: "fancy-input no-margin"
    }, /*#__PURE__*/React.createElement("a", {
      className: "button",
      href: `/members/emergency_contacts/${content.id}`,
      onClick: () => {
        return confirm('Are you sure? Continuing will report this access to the devs and committee.');
      }
    }, "Access Emergency Contacts"))))) : "", /*#__PURE__*/React.createElement("div", {
      className: "files"
    }, context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ? /*#__PURE__*/React.createElement("form", {
      className: "file",
      onSubmit: e => {
        handleUpload(e);
      },
      method: "post",
      encType: "multipart/form-data"
    }, /*#__PURE__*/React.createElement("div", {
      className: "loader"
    }), /*#__PURE__*/React.createElement("label", {
      htmlFor: "file",
      className: "icon",
      onClick: handleClick,
      onDragOver: e => {
        e.preventDefault();
      },
      onDrop: e => {
        handleFileDrop(e);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: "add"
    }), /*#__PURE__*/React.createElement("h4", null, "Add new file")), /*#__PURE__*/React.createElement("input", {
      ref: uploadRef,
      className: "filetext",
      onChange: handleFileSelect,
      type: "file",
      name: "files",
      multiple: true,
      required: true
    }), /*#__PURE__*/React.createElement("div", {
      className: "filetext",
      onClick: handleClick,
      onDragOver: e => {
        e.preventDefault();
      },
      onDrop: e => {
        handleFileDrop(e);
      }
    }, uploadFiles.length ? uploadFiles : "No Files Selected"), /*#__PURE__*/React.createElement("input", {
      className: "delete",
      type: "submit",
      value: "Upload"
    })) : "", files), /*#__PURE__*/React.createElement("div", {
      className: "timeline"
    }, /*#__PURE__*/React.createElement("a", {
      href: "",
      className: "post heading"
    }, /*#__PURE__*/React.createElement("span", {
      className: "date"
    }), /*#__PURE__*/React.createElement(Icon, {
      icon: "circle",
      timeline: "down"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text"
    }, /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, /*#__PURE__*/React.createElement("h2", null, "Posts")))), context.siteJson.current_user.is_authenticated && (content.directors.includes(context.siteJson.current_user.id) || context.siteJson.current_user.role) === "admin" ? /*#__PURE__*/React.createElement(Link, {
      className: "post",
      href: "",
      onClick: e => {
        handleNewPostClick(e);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "date"
    }), /*#__PURE__*/React.createElement(Icon, {
      icon: "add",
      timeline: "up"
    }), /*#__PURE__*/React.createElement("div", {
      className: "text"
    }, /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, /*#__PURE__*/React.createElement("h3", null, "Write a new post")), /*#__PURE__*/React.createElement("span", {
      className: "text"
    }, /*#__PURE__*/React.createElement("span", null, "Click here")))) : "", posts));
  }
}
function AccountSettings({
  content,
  refresh
}) {
  let subs_info = [];
  let subs_options = [];
  let active_subs = [];
  const levelRef = React.createRef(null);
  let [subsDetails, setSubsDetails] = React.useState("");
  let [showSubsForm, setShowSubsForm] = React.useState(false);
  let [is_for_dependent, set_is_for_dependent] = React.useState("NO");
  let subsFormRef = React.createRef(null);
  for (let i = 0; i < (content.subs.options || []).length; i++) {
    let option = content.subs.options[i];
    if (option.enabled) {
      let opts = {};
      if (option.desc) {
        opts.title = option.desc;
      }
      subs_info.push(/*#__PURE__*/React.createElement("li", _extends({
        key: i
      }, opts, {
        style: {
          order: option.amount
        }
      }), /*#__PURE__*/React.createElement("strong", null, option.name, ": "), "\xA3", (option.amount / 100).toFixed(2), " ", option.period));
      let details;
      if (option.period === "yearly") {
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        details = `Yearly subscription. Starts now, always renews on 1st ${months[parseInt(option.renewal_month, 10) - 1]}`;
      } else {
        details = "";
      }
      subs_options.push(/*#__PURE__*/React.createElement("option", {
        key: i,
        value: option.id,
        "data-details": details,
        style: {
          order: option.amount
        }
      }, option.name, " - \xA3", (option.amount / 100).toFixed(2), " ", option.period));
    }
  }
  for (let i = 0; i < (content.subs.active || []).length; i++) {
    let sub = content.subs.active[i];
    active_subs.push(/*#__PURE__*/React.createElement("div", {
      key: i,
      className: "sub_form",
      id: sub.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "sub form"
    }, /*#__PURE__*/React.createElement("div", {
      className: "type"
    }, /*#__PURE__*/React.createElement("h3", {
      className: ""
    }, sub.plan_name)), /*#__PURE__*/React.createElement("div", {
      className: "name"
    }, /*#__PURE__*/React.createElement("strong", null, "Name:"), /*#__PURE__*/React.createElement("span", null, sub.name)), /*#__PURE__*/React.createElement("div", {
      className: "rate"
    }, /*#__PURE__*/React.createElement("strong", null, "Rate: "), /*#__PURE__*/React.createElement("span", {
      className: "rate"
    }, "\xA3", (sub.plan_amount / 100).toFixed(2)), /*#__PURE__*/React.createElement("span", {
      className: "period"
    }, sub.plan_period)), /*#__PURE__*/React.createElement("div", {
      className: "billing"
    }, /*#__PURE__*/React.createElement("strong", null, "Last Billed:"), /*#__PURE__*/React.createElement("span", {
      className: "last_billed"
    }, "1st June 2024"), /*#__PURE__*/React.createElement("span", {
      className: "cancel"
    }, /*#__PURE__*/React.createElement("a", {
      href: `/members/api/account_settings/cancel_subscription/${sub.id}`,
      onClick: e => {
        handleSubCancel(e, sub.id);
      }
    }, "Cancel")), /*#__PURE__*/React.createElement("span", {
      className: "msg"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "loader"
    })));
  }
  function handleSubCancel(e, sub_id) {
    e.preventDefault();
    let sub = document.querySelector(`#${sub_id}`);
    sub.classList.add("pending");
    fetch(e.target.href, {
      method: "GET"
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        sub.classList.remove("pending");
        refresh();
      }
      sub.querySelector("span.msg").innerHTML = data.msg;
      sub.classList.remove("pending");
    });
  }
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    console.log(e);
    console.log(form);
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      console.log("CODE: ", data.code);
      if (data.code === 200) {
        console.log("SUCCESS");
        form.reset();
        setShowSubsForm(false);
        refresh();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.classList.remove("pending");
    });
  }
  function showSubsFormFunction(e) {
    e.preventDefault(e);
    setShowSubsForm(!showSubsForm);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
    className: "form_container three"
  }, /*#__PURE__*/React.createElement("form", {
    className: "subs",
    ref: subsFormRef,
    action: "/members/api/account_settings/start_subscription",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Manage Membership"), /*#__PURE__*/React.createElement("div", {
    className: "options"
  }, /*#__PURE__*/React.createElement("ul", null, subs_info)), /*#__PURE__*/React.createElement("h3", null, "Active Subs"), /*#__PURE__*/React.createElement("div", {
    className: "subs"
  }, active_subs), showSubsForm ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "new_subs_form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "heading"
  }, /*#__PURE__*/React.createElement("h3", null, "Add New Subscription"), /*#__PURE__*/React.createElement("span", {
    className: "close",
    onClick: e => {
      showSubsFormFunction(e);
    }
  }, "\xD7")), /*#__PURE__*/React.createElement(Input, {
    inputRef: levelRef,
    type: "select",
    value: "",
    id: "subs_level",
    label: "Membership Level",
    onChange: e => {
      setSubsDetails(e.target.selectedOptions[0].dataset.details);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Select a membership..."), subs_options), /*#__PURE__*/React.createElement("div", null, subsDetails), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    label: "Who is the subscription for?",
    onChange: e => set_is_for_dependent(e.target.value),
    value: is_for_dependent,
    stateful: true,
    id: "sub_for"
  }, /*#__PURE__*/React.createElement("option", {
    value: "SELF"
  }, "Myself"), /*#__PURE__*/React.createElement("option", {
    value: "OTHER"
  }, "Someone else")), is_for_dependent === "OTHER" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "name",
    label: "Name"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "phone_number",
    label: "Phone Number"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "e_con_name",
    label: "Emergency Contact Name"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "e_con_phone",
    label: "Emergency Contact Phone"
  })) : "", /*#__PURE__*/React.createElement(SquareCard, {
    formRef: subsFormRef
  }), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }))) : /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    name: "submit",
    value: "Add New Subscription",
    onClick: e => {
      showSubsFormFunction(e);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/account_settings/change_password",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Change Password"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "password",
    label: "Current Password",
    id: "old_password",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "password",
    label: "New Password",
    id: "new_password",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "password",
    label: "Confirm New Password",
    id: "confirm_new_password",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    name: "submit",
    value: "Change Password"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/account_settings/update_profile",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Update Profile"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    label: "First Name",
    id: "firstname",
    required: true,
    value: content.update_profile.firstname
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    label: "Last Name",
    id: "lastname",
    required: true,
    value: content.update_profile.lastname
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    name: "submit",
    value: "Update Profile"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/account_settings/update_contact_details",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Update Contact Details"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    label: "Phone Number",
    id: "phone_number",
    required: true,
    value: content.update_contact_details.phone_number
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    name: "submit",
    value: "Update Contact Details"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/account_settings/emergency_contact",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Emergency Contact"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    label: "Contact Name",
    id: "e_con_name",
    required: true,
    value: content.emergency_contact.name
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    label: "Phone Number",
    id: "e_con_phone",
    required: true,
    value: content.emergency_contact.number
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    name: "submit",
    value: "Update Contact Details"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })), /*#__PURE__*/React.createElement("form", {
    action: "/members/api/account_settings/two_factor",
    onSubmit: e => {
      handleFormSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("h2", null, "Two Factor Setup"), /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), !content.two_factor.enabled ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(QRCode, {
    data: content.two_factor.provisioning_qr
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    label: "OTP Code",
    id: "otp_code",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    name: "submit",
    value: "Enable Two Factor"
  })) : /*#__PURE__*/React.createElement("h3", null, "Two Factor Authentication is already setup.")), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }))));
}

"use strict";

const navItems = [{
  title: "Home",
  link: "/",
  class: ""
}, {
  title: "Blog",
  link: "/blog",
  class: ""
}, {
  title: "Past Shows",
  link: "/past-shows",
  class: ""
}, {
  title: "Auditions",
  link: "/auditions",
  class: ""
}, {
  title: "About Us",
  link: "/about-us",
  class: ""
}, {
  title: "Members",
  link: "/members",
  class: "",
  show_member_nav: true
}, {
  title: "Search",
  link: "/search",
  class: "search",
  icon: "search"
}];
const memberNavItemsMaster = {
  dashboard: {
    title: "Dashboard",
    link: "/members/dashboard",
    class: "",
    icon: "dashboard"
  },
  shows: {
    title: "Shows",
    link: "/members/shows",
    class: "",
    icon: "drama"
  },
  blog: {
    title: "Manage Blog",
    link: "/members/manage-blog",
    class: "",
    icon: "blog_icon"
  },
  get_subs: {
    title: "Get Subs",
    link: "/members/get_subs",
    class: "",
    icon: "membership"
  },
  bookings: {
    title: "Manage Bookings",
    link: "/members/bookings",
    class: "",
    icon: "ticket"
  },
  admin: {
    title: "Admin Tools",
    link: "/members/admin",
    class: "",
    icon: "admin",
    subNav: [{
      title: "Manage Media",
      link: "/members/admin/manage_media"
    }, {
      title: "Manage Shows",
      link: "/members/manage_shows"
    }, {
      title: "Add Show Photos",
      link: "/members/admin/set_show_photos"
    }, {
      title: "Add New Members",
      link: "/members/admin/add-show-member"
    }, {
      title: "Manage Users",
      link: "/members/admin/manage_users"
    }, {
      title: "Admin Settings",
      link: "/members/admin/admin_settings"
    }]
  },
  member_docs: {
    title: "Member Docs",
    link: "/members/docs",
    class: "",
    icon: "note"
  },
  account_settings: {
    title: "Account Settings",
    link: "/members/account_settings",
    class: "",
    icon: "person"
  },
  help: {
    title: "Help & Feedback",
    link: "",
    class: "",
    icon: "help",
    subNav: [{
      title: "Feedback Form",
      link: "/members/feedback_form"
    }, {
      title: "Help Docs",
      link: "https://github.com/mattl1598/open-amdram-portal/wiki"
    }]
  },
  logout: {
    title: "Logout",
    link: "/members/logout",
    class: "",
    icon: "logout"
  }
};
if (document.getElementById('nav') && !document.getElementById('app')) {
  const navRoot = ReactDOM.createRoot(document.getElementById('nav'));
  navRoot.render(/*#__PURE__*/React.createElement(Nav, {
    navItems: navItems,
    memberNavItems: memberNavItems,
    siteName: siteName
  }));
}
function Nav({
  navItems,
  siteName,
  logoSVG,
  memberNavItemsToShow,
  children
}) {
  const context = React.useContext(app);
  const navList = [];
  const memberNavList = [];
  const memberNavSubList = [];
  let memberNav, defaultMemberValue, defaultSubValue;
  let showMemberNav = false;
  const gapRef = React.useRef();
  const memberNavSelectRef = React.useRef();
  const [mobileNav, setMobileNav] = React.useState(false);
  // const [memberNav, setMemberNav] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false);
  function closeMobileNav() {
    setExpanded(false);
  }
  if (navItems) {
    for (let i = 0; i < navItems.length; i++) {
      let is_active = navItems[i].link.split("/")[1] === window.location.pathname.split("/")[1];
      navList.push(/*#__PURE__*/React.createElement(NavItem, {
        key: i,
        item: navItems[i],
        is_active: is_active,
        mobileNav: mobileNav,
        onClick: closeMobileNav
      }));
      if (is_active && navItems[i].show_member_nav && RegExp(`^${navItems[i].link}/`, "i").test(window.location.pathname)) {
        showMemberNav = true;
      }
    }
  }
  if (showMemberNav && memberNavItemsToShow !== undefined) {
    for (let i = 0; i < Object.keys(memberNavItemsMaster).length; i++) {
      let key = Object.keys(memberNavItemsMaster)[i];
      if (memberNavItemsToShow[key]) {
        let memberNavItem = memberNavItemsMaster[key];
        if (key === "shows") {
          let subNav = [];
          for (let j = 0; j < context.siteJson.mostRecentMemberShows.length; j++) {
            let show = context.siteJson.mostRecentMemberShows[j];
            subNav.push({
              title: show.title,
              link: `/members/show/${show.id}`
            });
          }
          memberNavItem.subNav = subNav;
        }
        let is_active = memberNavItem.link.split("/")[2] === window.location.pathname.split("/")[2] && window.location.pathname.split("/").length > 2;
        if (mobileNav) {
          if (is_active) {
            defaultMemberValue = memberNavItem.link;
          }
          memberNavList.push(/*#__PURE__*/React.createElement(NavItem, {
            key: i,
            item: memberNavItem,
            is_active: is_active,
            mobileNav: mobileNav,
            memberNav: true
          }));
        } else {
          memberNavList.push(/*#__PURE__*/React.createElement(NavItem, {
            key: i,
            item: memberNavItem,
            is_active: is_active,
            mobileNav: mobileNav,
            memberNav: true
          }));
        }
        if (is_active && memberNavItem.subNav !== undefined) {
          defaultMemberValue = memberNavItem.link;
          memberNavSubList.push(/*#__PURE__*/React.createElement(NavItem, {
            key: i,
            item: memberNavItem,
            mobileNav: mobileNav,
            memberNav: true
          }));
          for (let j = 0; j < memberNavItem.subNav.length; j++) {
            let sub_is_active = memberNavItem.subNav[j].link.split("/")[3] === window.location.pathname.split("/")[3] && window.location.pathname.split("/").length > 3;
            if (sub_is_active) {
              defaultMemberValue = memberNavItem.subNav[j].link;
            }
            if (mobileNav) {
              memberNavSubList.push(/*#__PURE__*/React.createElement(NavItem, {
                key: j,
                item: memberNavItem.subNav[j],
                is_active: sub_is_active,
                mobileNav: mobileNav,
                memberNav: true
              }));
            } else {
              memberNavSubList.push(/*#__PURE__*/React.createElement(NavItem, {
                key: j,
                item: memberNavItem.subNav[j],
                is_active: sub_is_active,
                mobileNav: mobileNav,
                memberNav: true
              }));
            }
          }
        }
      }
    }
    let style = {
      width: `${mobileNav ? "calc(100dvw - " + (document.body.offsetWidth - document.body.clientWidth).toString() + "px)" : "fit-content"}`
    };
    if (mobileNav) {
      memberNav = /*#__PURE__*/React.createElement("div", {
        className: "members-nav-outer",
        style: style
      }, /*#__PURE__*/React.createElement("select", {
        ref: memberNavSelectRef,
        className: "members-nav-main",
        defaultValue: defaultMemberValue,
        style: style,
        onChange: handleMemberNavChange
      }, memberNavList));
    } else {
      memberNav = /*#__PURE__*/React.createElement("div", {
        className: "members-nav-outer",
        style: {
          width: `${mobileNav ? "calc(100dvw - " + (document.body.offsetWidth - document.body.clientWidth).toString() + "px)" : "fit-content"}`
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "members-nav-main"
      }, memberNavList));
    }
  }
  React.useEffect(() => {
    function handleResize() {
      if (gapRef) {
        if (mobileNav !== !gapRef.current.offsetWidth) {
          setMobileNav(!gapRef.current.offsetWidth);
        }
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
  });
  function expand(e) {
    e.preventDefault();
    setExpanded(!expanded);
  }
  function handleMemberNavChange(e) {
    e.preventDefault();
    context.functions.setPath(memberNavSelectRef.current.value);
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    id: "react-nav",
    className: "react-nav"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/",
    className: "title",
    title: "Home"
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: "siteLogo"
  }), siteName ? /*#__PURE__*/React.createElement("h1", null, siteName.split(" ").map(a => {
    return /*#__PURE__*/React.createElement("span", null, a);
  })) : "")), /*#__PURE__*/React.createElement("div", {
    className: "full-nav"
  }, /*#__PURE__*/React.createElement("div", {
    ref: gapRef,
    className: "gap"
  }), /*#__PURE__*/React.createElement("div", {
    className: "nav"
  }, navList)), /*#__PURE__*/React.createElement("div", {
    className: `hamburger ${mobileNav ? "show" : "hide"}`,
    onClick: e => {
      expand(e);
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: `hamburger`
  }, /*#__PURE__*/React.createElement("svg", {
    className: `expand-icon search ${mobileNav && expanded ? "" : "collapsed"}`,
    id: "menu-icon",
    viewBox: "0 0 70 70",
    preserveAspectRatio: "xMidYMin"
  }, /*#__PURE__*/React.createElement("path", {
    className: "line one",
    d: "m 15 19 l 45 0"
  }), /*#__PURE__*/React.createElement("path", {
    className: "line two",
    d: "m 15 35 l 45 0"
  }), /*#__PURE__*/React.createElement("path", {
    className: "line three",
    d: "m 15 51 l 45 0"
  })))), /*#__PURE__*/React.createElement("div", {
    className: `mobile-nav ${mobileNav && expanded ? "show" : "hide"}`
  }, navList), showMemberNav && mobileNav ? memberNav : ""), /*#__PURE__*/React.createElement("div", {
    className: `main-outer ${mobileNav && 1 ? "mobile" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    id: "desktop_member_nav",
    className: "portal-nav side"
  }, showMemberNav && mobileNav ? "" : memberNav), children));
}
function optionNavItem({
  item,
  is_active,
  mobileNav,
  memberNav = false
}) {
  let subNavList = [];
  if (item.subNav !== undefined) {
    for (let i = 0; i < item.subNav.length; i++) {
      let sub_is_active = item.subNav[i].link.split("/")[3] === window.location.pathname.split("/")[3] && window.location.pathname.split("/").length > 3;
      subNavList.push(/*#__PURE__*/React.createElement(MemberNavItem, {
        key: i,
        item: item.subNav[i],
        is_active: sub_is_active,
        mobileNav: mobileNav,
        memberNav: true
      }));
    }
  }
  if (item.subNav !== undefined) {
    return /*#__PURE__*/React.createElement("optgroup", {
      label: item.title
    }, subNavList);
  } else {
    return /*#__PURE__*/React.createElement("option", {
      value: item.link
    }, item.title);
  }
}
function NavItem({
  item,
  is_active,
  mobileNav,
  onClick,
  memberNav = false
}) {
  let style = {
    width: `calc(100dvw - ${mobileNav ? document.body.offsetWidth - document.body.clientWidth : 0}px)`
  };
  if (memberNav) {
    style = {};
  }
  let subNavList = [];
  if (item.subNav !== undefined && !mobileNav) {
    for (let i = 0; i < item.subNav.length; i++) {
      let sub_is_active = item.subNav[i].link.split("/")[3] === window.location.pathname.split("/")[3] && window.location.pathname.split("/").length > 3;
      subNavList.push(/*#__PURE__*/React.createElement("li", {
        key: item.subNav[i].link
      }, /*#__PURE__*/React.createElement(NavItem, {
        key: item.subNav[i].link,
        item: item.subNav[i],
        is_active: sub_is_active,
        mobileNav: mobileNav,
        memberNav: true
      })));
    }
  } else if (item.subNav !== undefined && mobileNav) {
    for (let i = 0; i < item.subNav.length; i++) {
      subNavList.push(/*#__PURE__*/React.createElement(NavItem, {
        key: item.subNav[i].link,
        item: item.subNav[i],
        is_active: false,
        mobileNav: mobileNav,
        memberNav: true
      }));
    }
  }
  let subNav = "";
  if (subNavList.length > 0 && !mobileNav) {
    subNav = /*#__PURE__*/React.createElement("ul", null, subNavList);
  }
  if (memberNav && mobileNav) {
    if (subNavList.length > 0) {
      return /*#__PURE__*/React.createElement("optgroup", {
        label: item.title
      }, subNavList);
    } else {
      return /*#__PURE__*/React.createElement("option", {
        value: item.link
      }, item.title);
    }
  }
  if (item.icon !== undefined) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Link, {
      href: item.link,
      className: is_active ? `${item.class} active` : `${item.class}`,
      style: style,
      alsoOnClick: onClick
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: item.icon
    }), /*#__PURE__*/React.createElement("h3", {
      className: "mobile"
    }, item.title)), subNav);
  } else {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Link, {
      href: item.link,
      className: is_active ? `${item.class} active` : `${item.class}`,
      style: style,
      alsoOnClick: onClick
    }, /*#__PURE__*/React.createElement("h3", null, item.title)), subNav);
  }
}

"use strict";

// TODO LIST
// TODO: loading bar on link click? + more error catching in router.js
const alphaNum = RegExp("[^A-Za-z0-9 ]", "g");
const hasSetDiff = typeof new Set().difference === 'function';
function emp(string) {
  if (string) {
    return string;
  } else {
    return "";
  }
}
function ListShows({
  content
}) {
  let yearMin = Infinity;
  let yearMax = -Infinity;
  for (let i = 0; i < content.shows.length; i++) {
    let showYear = new Date(content.shows[i].date).getFullYear();
    if (showYear > yearMax) {
      yearMax = showYear;
    }
    if (showYear < yearMin) {
      yearMin = showYear;
    }
  }
  const [displayMode, setDisplayMode] = React.useState(content.default_layout ? content.default_layout : "cards");
  const [expandSearch, setExpandSearch] = React.useState(false);
  const [expandFilterMenu, setExpandFilterMenu] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortMode, setSortMode] = React.useState("time_ascending");
  const [genreFilter, setGenreFilter] = React.useState([]);
  const [seasonFilter, setSeasonFilter] = React.useState([]);
  const [memberFilter, setMemberFilter] = React.useState([]);
  const [lowerYearFilter, setLowerYearFilter] = React.useState(yearMin);
  const [higherYearFilter, setHigherYearFilter] = React.useState(yearMax);
  let memberOptions = [];
  let genreOptions = new Set();
  let seasonOptions = new Set();
  const sortSelectRef = React.createRef();
  let sortingModes = {
    time_ascending: {
      reverse: true,
      order_property: "date",
      text: "Date (New to Old)",
      icon: "sort_clock_ascending"
    },
    time_descending: {
      reverse: false,
      order_property: "date",
      text: "Date (Old to New)",
      icon: "sort_clock_descending"
    },
    alphabetical_ascending: {
      reverse: false,
      order_property: "title",
      text: "Title (A to Z)",
      icon: "sort_alphabetical_ascending"
    },
    alphabetical_descending: {
      reverse: true,
      order_property: "title",
      text: "Title (Z to A)",
      icon: "sort_alphabetical_descending"
    },
    results_ascending: {
      reverse: true,
      order_property: "relevance",
      text: "Relevance (Most to Least)",
      icon: "sort_ascending"
    },
    results_descending: {
      reverse: false,
      order_property: "relevance",
      text: "Relevance (Least to Most)",
      icon: "sort_descending"
    }
  };
  const [showThumbsReady, setShowThumbsReady] = React.useState(false);
  React.useEffect(() => {
    window.serviceWorkerReady.then(() => {
      preloadImages('/show_thumbs');
    }).then(() => {
      setShowThumbsReady(true);
    });
  }, []);
  let shows = {};
  // console.log(displayMode)
  if (searchTerm.length) {
    for (let i = 0; i < content.shows.length; i++) {
      content.shows[i].route = ["/past-shows", "/members/manage_shows"][1 * (content.admin || false)];
      let key = 0;
      let date = new Date(content.shows[i].date);
      let dateArr = [date.toLocaleString('default', {
        month: 'long'
      }).toLowerCase(), `${date.getFullYear()}`];
      let contentTerms = [...emp(content.shows[i].title).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i), ...emp(content.shows[i].genre).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i), ...emp(content.shows[i].season).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i), ...dateArr].reduce(function (arr, value, index, input) {
        let incr_amount = 1 - index / input.length;
        for (let j = 1; j <= value.length; j++) {
          arr[value] ? arr[value.slice(0, j)] += incr_amount * (j / value.length) : arr[value.slice(0, j)] = incr_amount * (j / value.length);
        }
        return arr;
        // return (
        //     arr[value] ? arr[value] = arr[value] + 1-index/input.length : (arr[value] = 1-index/input.length),
        //     arr
        // );
      }, {});
      let searchTerms = emp(searchTerm).replace(/[+&]/, "and").replace(alphaNum, "").toLowerCase().split(" ").filter(i => i);
      for (let j = 0; j < searchTerms.length; j++) {
        key += (contentTerms[searchTerms[j]] || -10000) * (searchTerms.length - j);
      }
      if (key > 0) {
        key = `${key.toFixed(18)}${content.shows[i].id}`;
        if (Object.keys(shows).includes(key)) {
          key += content.shows[i].date;
        }
        shows[key] = /*#__PURE__*/React.createElement(ShowListItem, {
          key: i,
          item: content.shows[i],
          loadThumb: showThumbsReady
        });
      }
    }
  } else {
    let memberFilteredShows = new Set(content.shows.map(show => {
      return show.id;
    }));
    for (let i = 0; i < memberFilter.length; i++) {
      let thisMembersShows = new Set(content.members[memberFilter[i]].shows);
      memberFilteredShows = memberFilteredShows.intersection(thisMembersShows);
    }
    for (let i = 0; i < content.shows.length; i++) {
      content.shows[i].route = ["/past-shows", "/members/manage_shows"][1 * (content.admin || false)];
      let key = content.shows[i][sortingModes[sortMode].order_property] || "";
      if (Object.keys(shows).includes(key)) {
        key += content.shows[i].date;
      }
      let showThis = true;
      if (content.shows[i].genre) {
        genreOptions.add(content.shows[i].genre);
      }
      if (content.shows[i].season) {
        seasonOptions.add(content.shows[i].season);
      }
      showThis *= !memberFilter.length || memberFilteredShows.has(content.shows[i].id);
      showThis *= !genreFilter.length || genreFilter.includes(content.shows[i].genre);
      showThis *= !seasonFilter.length || seasonFilter.includes(content.shows[i].season);
      let year = new Date(content.shows[i].date).getFullYear();
      showThis *= lowerYearFilter <= year && year <= higherYearFilter;
      if (showThis) {
        shows[key] = /*#__PURE__*/React.createElement(ShowListItem, {
          key: i,
          item: content.shows[i],
          loadThumb: showThumbsReady
        });
      }
    }
  }
  if (content.members) {
    // fix for listing shows for a single member
    let memberKeys = Object.keys(content.members);
    for (let i = 0; i < memberKeys.length; i++) {
      let key = memberKeys[i];
      memberOptions.push(/*#__PURE__*/React.createElement("option", {
        key: key,
        value: key
      }, content.members[key].name));
    }
  }
  let sortOptions = [];
  let sortKeys = Object.keys(sortingModes);
  for (let i = 0; i < sortKeys.length; i++) {
    sortOptions.push(/*#__PURE__*/React.createElement("option", {
      key: i,
      value: sortKeys[i]
    }, sortingModes[sortKeys[i]].text));
  }
  function handleSortChange(e) {
    setSortMode(e.target.value);
  }
  function resetYearsFilter() {
    setLowerYearFilter(yearMin);
    setHigherYearFilter(yearMax);
  }
  function removeGenreFilter(item) {
    let index = genreFilter.indexOf(item);
    if (index > -1) {
      genreFilter.splice(index, 1);
    }
    setGenreFilter([...genreFilter]);
  }
  function removeMemberFilter(item) {
    let index = memberFilter.indexOf(item);
    if (index > -1) {
      memberFilter.splice(index, 1);
    }
    setMemberFilter([...memberFilter]);
  }
  function removeSeasonFilter(item) {
    let index = seasonFilter.indexOf(item);
    if (index > -1) {
      seasonFilter.splice(index, 1);
    }
    setSeasonFilter([...seasonFilter]);
  }
  let showChildren = Object.entries(shows).sort().map(a => {
    return a[1];
  });
  if (sortingModes[sortMode].reverse) {
    showChildren.reverse();
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
    className: `filtering ${expandFilterMenu ? "show_filter_menu" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "search"
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: "search",
    onClick: () => {
      setExpandSearch(true);
      setSortMode("results_ascending");
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: `searchbox ${expandSearch}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "search",
    onChange: e => {
      setSearchTerm(e.target.value);
    },
    value: searchTerm
  }), /*#__PURE__*/React.createElement(Icon, {
    icon: "cross",
    className: "cross",
    onClick: () => {
      setExpandSearch(false);
      setSearchTerm("");
      setSortMode("time_ascending");
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sort"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "sortMode",
    onClick: () => {
      sortSelectRef.current.showPicker();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: sortingModes[sortMode].icon
  }), /*#__PURE__*/React.createElement("span", null, "Sort:\xA0"), /*#__PURE__*/React.createElement("select", {
    ref: sortSelectRef,
    onChange: handleSortChange,
    name: "sortMode",
    id: "sortMode",
    value: sortMode,
    onClick: e => {
      e.stopPropagation();
    }
  }, sortOptions))), /*#__PURE__*/React.createElement("div", {
    className: "filter",
    onClick: () => {
      setExpandFilterMenu(!expandFilterMenu);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: "filter"
  }), /*#__PURE__*/React.createElement("span", null, "Filters", genreFilter.length || seasonFilter.length || lowerYearFilter > yearMin || higherYearFilter > yearMax ? ` (${genreFilter.length + seasonFilter.length + (lowerYearFilter > yearMin || higherYearFilter > yearMax)} Applied)` : "")), /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, memberFilter.length ? memberFilter.map(val => {
    return /*#__PURE__*/React.createElement("div", {
      className: "member",
      onClick: () => {
        removeMemberFilter(val);
      }
    }, content.members[val].name);
  }) : "", genreFilter.length ? genreFilter.map(val => {
    return /*#__PURE__*/React.createElement("div", {
      className: "genre",
      onClick: () => {
        removeGenreFilter(val);
      }
    }, val);
  }) : "", seasonFilter.length ? seasonFilter.map(val => {
    return /*#__PURE__*/React.createElement("div", {
      className: "season",
      onClick: () => {
        removeSeasonFilter(val);
      }
    }, val);
  }) : "", lowerYearFilter > yearMin || higherYearFilter < yearMax ? /*#__PURE__*/React.createElement("div", {
    className: "year",
    onClick: resetYearsFilter
  }, lowerYearFilter, " - ", higherYearFilter) : ""), /*#__PURE__*/React.createElement("div", {
    className: "filter_menu"
  }, /*#__PURE__*/React.createElement("ul", null, hasSetDiff ? /*#__PURE__*/React.createElement("li", null, "Members:", /*#__PURE__*/React.createElement(Select, {
    id: "member_filter",
    selected: memberFilter,
    setSelected: setMemberFilter,
    placeholder: "Filter by Members..."
  }, memberOptions)) : /*#__PURE__*/React.createElement(React.Fragment, null), /*#__PURE__*/React.createElement("li", null, "Genres:", /*#__PURE__*/React.createElement(Select, {
    id: "genre_filter",
    selected: genreFilter,
    setSelected: setGenreFilter,
    placeholder: "Filter by Genre..."
  }, [...genreOptions].map(val => {
    return /*#__PURE__*/React.createElement("option", {
      value: val,
      key: val
    }, val);
  }))), /*#__PURE__*/React.createElement("li", null, "Seasons:", /*#__PURE__*/React.createElement(Select, {
    id: "season_filter",
    selected: seasonFilter,
    setSelected: setSeasonFilter,
    placeholder: "Filter by Season..."
  }, [...seasonOptions].map(val => {
    return /*#__PURE__*/React.createElement("option", {
      value: val,
      key: val
    }, val);
  }))), /*#__PURE__*/React.createElement("li", null, "Years:", /*#__PURE__*/React.createElement(Range, {
    min: yearMin,
    max: yearMax,
    lowerVal: lowerYearFilter,
    higherVal: higherYearFilter,
    lowerValSetter: setLowerYearFilter,
    higherValSetter: setHigherYearFilter
  })))), /*#__PURE__*/React.createElement("div", {
    className: "resultsCount"
  }, showChildren.length, " results found.")), /*#__PURE__*/React.createElement("div", {
    className: `${displayMode}_mode`,
    id: "past_shows"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "image"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "show_title"
  }, "Show"), /*#__PURE__*/React.createElement("h3", {
    className: "season"
  }, "Season"), /*#__PURE__*/React.createElement("h3", {
    className: "genre"
  }, "Genre"), /*#__PURE__*/React.createElement("h3", {
    className: "cast"
  }, "Cast Roles"), /*#__PURE__*/React.createElement("h3", {
    className: "crew"
  }, "Crew Roles")), showChildren));
}
function ShowListItem({
  item,
  order_prop,
  loadThumb
}) {
  return /*#__PURE__*/React.createElement(Link, {
    className: "link",
    href: `${item.route}/${item.id}/${item.title.replace(' ', '_')}`,
    order: item[order_prop]
  }, /*#__PURE__*/React.createElement("div", {
    className: "image"
  }, /*#__PURE__*/React.createElement(Image, {
    className: "programme",
    src: `${item.programme}?lowres`,
    alt: `${item.title} programme cover`,
    load: loadThumb,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("div", {
    className: "show_title"
  }, /*#__PURE__*/React.createElement("h3", null, item.title)), /*#__PURE__*/React.createElement("div", {
    className: "season"
  }, item.season, " ", new Date(item.date).getFullYear()), /*#__PURE__*/React.createElement("div", {
    className: "genre"
  }, item.genre), /*#__PURE__*/React.createElement("div", {
    className: "cast"
  }, item.cast), /*#__PURE__*/React.createElement("div", {
    className: "crew"
  }, item.crew));
}
function ShowPage({
  content
}) {
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let dateObj = new Date(content.show.date);
  const parser = new DOMParser();
  let [nodaReview, setNodaReview] = React.useState(/*#__PURE__*/React.createElement("div", {
    className: "loader"
  }));
  // let [nodaReview, setNodaReview] = React.useState(parser.parseFromString("<div class='selectMe'><div class='loader'></div></div>", "text/html").querySelector(".selectMe"))
  let [gotNodaReview, setGotNodaReview] = React.useState(false);
  React.useEffect(() => {
    if (content.id) {
      window.serviceWorkerReady.then(() => {
        preloadImages(`/thumbs/${content.id}`);
      });
    }
  }, []);
  let directors = [];
  let producers = [];
  let cast = {};
  let castRows = [];
  for (let i = 0; i < content.cast.length; i++) {
    if (cast[`${content.cast[i].order}${content.cast[i].role}`]) {
      cast[`${content.cast[i].order}${content.cast[i].role}`] = [...cast[`${content.cast[i].order}${content.cast[i].role}`], content.cast[i]];
    } else {
      cast[`${content.cast[i].order}${content.cast[i].role}`] = [content.cast[i]];
    }
  }
  let castKeys = Object.keys(cast);
  for (let i = 0; i < castKeys.length; i++) {
    let names = [];
    for (let j = 0; j < cast[castKeys[i]].length; j++) {
      names.push(/*#__PURE__*/React.createElement(Link, {
        key: `cast${j}`,
        href: `/past-shows/member/${cast[castKeys[i]][j].id}/${cast[castKeys[i]][j].name}`
      }, cast[castKeys[i]][j].name));
      names.push(/*#__PURE__*/React.createElement("br", {
        key: `castBreak${j}`
      }));
    }
    castRows.push(/*#__PURE__*/React.createElement("tr", {
      key: `castTable${i}`
    }, /*#__PURE__*/React.createElement("td", null, cast[castKeys[i]][0].role), /*#__PURE__*/React.createElement("td", null, names)));
  }
  let crew = {};
  let crewRows = [];
  for (let i = 0; i < content.crew.length; i++) {
    if (crew[`${content.crew[i].order}${content.crew[i].role}`]) {
      crew[`${content.crew[i].order}${content.crew[i].role}`] = [...crew[`${content.crew[i].order}${content.crew[i].role}`], content.crew[i]];
    } else {
      crew[`${content.crew[i].order}${content.crew[i].role}`] = [content.crew[i]];
    }
  }
  let crewKeys = Object.keys(crew);
  for (let i = 0; i < crewKeys.length; i++) {
    let names = [];
    for (let j = 0; j < crew[crewKeys[i]].length; j++) {
      let link = /*#__PURE__*/React.createElement(Link, {
        key: `crew${j}`,
        href: `/past-shows/member/${crew[crewKeys[i]][j].id}/${crew[crewKeys[i]][j].name.replace(' ', '_')}`
      }, crew[crewKeys[i]][j].name);
      names.push(link);
      names.push(/*#__PURE__*/React.createElement("br", {
        key: `crewBreak${j}`
      }));
      if (crew[crewKeys[i]][0].role === "Director") {
        let newLink = React.cloneElement(link, {
          key: `director${j}`,
          className: "director"
        });
        directors.push(newLink);
      } else if (crew[crewKeys[i]][0].role === "Producer") {
        let newLink = React.cloneElement(link, {
          key: `producer${j}`,
          className: "producer"
        });
        producers.push(newLink);
      }
    }
    crewRows.push(/*#__PURE__*/React.createElement("tr", {
      key: `castTable${i}`
    }, /*#__PURE__*/React.createElement("td", null, crew[crewKeys[i]][0].role), /*#__PURE__*/React.createElement("td", null, names)));
  }
  const [castRoles, setCastRoles] = React.useState([]);
  if (content.faces) {
    React.useEffect(() => {
      const photo_keys = Object.keys(content.faces);
      let tempPhotos = {};
      for (let i = 0; i < content.photos.length; i++) {
        tempPhotos[content.photos[i].id] = content.photos[i];
      }
      let tempFaces = {};
      for (let i = 0; i < photo_keys.length; i++) {
        const photo_faces = content.faces[photo_keys[i]];
        for (let j = 0; j < photo_faces.length; j++) {
          let face = photo_faces[j];
          photo_faces[j].url = `/photo_new/${photo_keys[i]}`;
          photo_faces[j].style = {
            position: "absolute",
            width: `${tempPhotos[photo_keys[i]].width / face.w * 100}%`,
            height: `${tempPhotos[photo_keys[i]].height / face.h * 100}%`,
            top: `-${face.y / face.h * 100}%`,
            left: `-${face.x / face.w * 100}%`
          };
          if (tempFaces[photo_faces[j].member]) {
            tempFaces[photo_faces[j].member].push(photo_faces[j]);
          } else {
            tempFaces[photo_faces[j].member] = [photo_faces[j]];
          }
        }
      }
      const face_keys = Object.keys(tempFaces);
      for (let i = 0; i < face_keys.length; i++) {
        tempFaces[face_keys[i]].sort((a, b) => {
          return b.h * b.w - a.h * a.w;
        });
      }
      let tempCast = [];
      for (let i = 0; i < content.cast.length; i++) {
        if (tempFaces[content.cast[i].id]) {
          tempCast.push(/*#__PURE__*/React.createElement("div", {
            className: "cast_member"
          }, /*#__PURE__*/React.createElement("div", {
            className: "photo"
          }, /*#__PURE__*/React.createElement("img", {
            className: "face",
            src: `${tempFaces[content.cast[i].id][0].url}`,
            style: tempFaces[content.cast[i].id][0].style,
            alt: `${content.cast[i].name}`
          })), /*#__PURE__*/React.createElement("h2", null, content.cast[i].name), /*#__PURE__*/React.createElement("h3", null, content.cast[i].role), /*#__PURE__*/React.createElement("h4", null, "(as ...)")));
        } else {/*console.log(content.cast[i].name)*/}
      }
      setCastRoles(tempCast);
    }, []);
  }
  function getNODAReport() {
    if (content.show.noda_review && !gotNodaReview) {
      fetch("/cors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: content.show.noda_review
        })
      })
      // .then((data) => {return data.body})
      .then(data => {
        return data.text();
      }).then(data => {
        let domObject = parser.parseFromString(data, "text/html");
        let queryResults = domObject.querySelectorAll('.page_subheading, .page_content');
        let temp = [];
        let styleRegex = RegExp(` style="[^"]+">`, "g");
        for (let i = 0; i < queryResults.length; i++) {
          let html = String(queryResults[i].innerHTML);
          html = html.replaceAll(styleRegex, ">");
          temp.push(/*#__PURE__*/React.createElement("div", {
            key: `noda${i}`,
            dangerouslySetInnerHTML: {
              __html: html
            }
          }));
        }
        setNodaReview(/*#__PURE__*/React.createElement(React.Fragment, null, temp));
        setGotNodaReview(true);
      });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "details-outer"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
    className: "details-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "details-cover"
  }, /*#__PURE__*/React.createElement(Image, {
    src: content.show.programme,
    alt: `${content.show.title} programme cover`,
    className: "programme"
  })), /*#__PURE__*/React.createElement("div", {
    className: "details-text"
  }, /*#__PURE__*/React.createElement("h3", null, content.show.season, " - ", months[dateObj.getMonth()], " ", dateObj.getFullYear()), /*#__PURE__*/React.createElement("p", null, "Type: ", content.show.show_type, " ", content.show.genre), /*#__PURE__*/React.createElement("p", {
    className: "directors_producers"
  }, "Directed by: ", directors), /*#__PURE__*/React.createElement("p", {
    className: "directors_producers"
  }, "Produced by: ", producers), /*#__PURE__*/React.createElement("p", null, "Written by: ", content.show.author), content.show.radio_audio ? /*#__PURE__*/React.createElement("audio", {
    src: content.show.radio_audio,
    controls: true
  }) : /*#__PURE__*/React.createElement(React.Fragment, null), /*#__PURE__*/React.createElement(Markdown, {
    content: content.show.text_blob
  }), content.show.noda_review ? /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", {
    onClick: getNODAReport
  }, "NODA Review"), /*#__PURE__*/React.createElement("div", null, nodaReview)) : /*#__PURE__*/React.createElement(React.Fragment, null)))), /*#__PURE__*/React.createElement(Tabs, null, content.photos.length ? /*#__PURE__*/React.createElement(Tab, {
    title: "Photos"
  }, /*#__PURE__*/React.createElement(Gallery, {
    key: "photos",
    imageLinks: content.photos,
    faces: content.faces
  })) : /*#__PURE__*/React.createElement(React.Fragment, null), content.videos.length ? /*#__PURE__*/React.createElement(Tab, {
    title: "Videos"
  }, /*#__PURE__*/React.createElement(Gallery, {
    key: "videos",
    imageLinks: content.videos,
    type: "videos"
  })) : /*#__PURE__*/React.createElement(React.Fragment, null)), /*#__PURE__*/React.createElement("div", {
    className: "cast_crew"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cast"
  }, /*#__PURE__*/React.createElement("h3", null, "Cast:"), false ?
  /*#__PURE__*/
  // content.faces && Object.keys(content.faces) &&
  React.createElement("div", {
    className: "cast"
  }, castRoles) : /*#__PURE__*/React.createElement("table", {
    className: "roles_table"
  }, /*#__PURE__*/React.createElement("tbody", null, castRows))), /*#__PURE__*/React.createElement("div", {
    className: "crew"
  }, /*#__PURE__*/React.createElement("h3", null, "Crew:"), /*#__PURE__*/React.createElement("table", {
    className: "roles_table"
  }, /*#__PURE__*/React.createElement("tbody", null, crewRows)))));
}
function waitForController() {
  return new Promise(resolve => {
    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.controller);
      return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => resolve(navigator.serviceWorker.controller), {
      once: true
    });
  });
}
function sendToWorker(message) {
  return navigator.serviceWorker.ready.then(async registration => {
    const controller = navigator.serviceWorker.controller || registration.active;
    if (!controller) {
      const nextController = await waitForController();
      if (!nextController) return false;
      return postMessageToWorker(nextController, message);
    }
    return postMessageToWorker(controller, message);
  });
}
function postMessageToWorker(target, message) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = event => {
      resolve(event.data && event.data.ok === true);
    };
    target.postMessage(message, [channel.port2]);
  });
}
function registerImageCacheWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log("Service worker not in navigator.");
    return Promise.resolve(null);
  }
  return navigator.serviceWorker.ready.catch(() => null);
}
function postToServiceWorker(message) {
  return navigator.serviceWorker.ready.then(registration => {
    const target = registration.active || navigator.serviceWorker.controller;
    if (!target) {
      return false;
    }
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        resolve(event.data && event.data.ok === true);
      };
      target.postMessage(message, [channel.port2]);
    });
  });
}
function cacheImagesInWorker(images) {
  return postToServiceWorker({
    type: 'CACHE_IMAGES',
    images: images
  });
}
function preloadImages(url) {
  // console.log("loading", performance.now())
  return registerImageCacheWorker().then(() => {
    return fetch(url).then(response => response.json()).then(images => {
      cacheImagesInWorker(images).then(ok => {
        // console.log("cached", performance.now())
      });
    });
  });
}

"use strict";

// function handleClick(e) {
// 	if (alsoOnClick !== undefined) {
// 		alsoOnClick()
// 	}
// 	if (target !== "_blank") {
// 		e.preventDefault()
// 		context.functions.setPath(href)
// 	}
// }
function Link({
  href,
  className,
  children,
  style,
  title = "",
  target = "_self",
  onClick = "null",
  alsoOnClick = "null"
}) {
  const context = React.useContext(app);
  function handleClick(e) {
    if (alsoOnClick !== "null") {
      alsoOnClick();
    }
    if (onClick !== "null") {
      onClick(e);
    } else if (target !== "_blank") {
      e.preventDefault();
      context.functions.setPath(href);
    }
  }
  return /*#__PURE__*/React.createElement("a", {
    className: className,
    href: href,
    onClick: e => {
      handleClick(e);
    },
    style: style,
    target: target,
    title: title
  }, children);
}
function ErrorComponent({
  content
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, /*#__PURE__*/React.createElement("h2", null, "Error ", content.title), /*#__PURE__*/React.createElement("p", null, content.message || "An unexpected error occurred. Please try again later.")));
}
function Frontpage({
  nextShow,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "content",
    key: `content_${nextShow.title}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "next_show",
    key: `next_show_${nextShow.title}`
  }, nextShow.banner ? ReactDOM.createPortal([/*#__PURE__*/React.createElement(Link, {
    key: "tickets_banner",
    href: "/tickets"
  }, /*#__PURE__*/React.createElement(Image, {
    key: "banner1",
    i: "banner",
    src: nextShow.banner
  }))], document.querySelector("#banner")) : "", /*#__PURE__*/React.createElement("h2", null, "Our Next Show"), /*#__PURE__*/React.createElement("h1", null, nextShow.title), /*#__PURE__*/React.createElement("h3", null, nextShow.subtitle), /*#__PURE__*/React.createElement("hr", null)), children);
}
function Files({
  title,
  files,
  children
}) {
  if (files !== undefined && files.length > 0) {
    let fileTags = [];
    if (files) {
      let file_route = "/file";
      if (RegExp("^/members/", "i").test(window.location.pathname)) {
        file_route = "/members/file";
      }
      for (let i = 0; i < files.length; i++) {
        fileTags.push(/*#__PURE__*/React.createElement(Link, {
          key: files[i].id,
          href: `${file_route}/${files[i].id}/${files[i].name.replaceAll(" ", "_")}`,
          className: "file"
        }, /*#__PURE__*/React.createElement(Icon, {
          icon: "pdf",
          timeline: "up"
        }), /*#__PURE__*/React.createElement("div", {
          className: "text"
        }, /*#__PURE__*/React.createElement("span", {
          className: "title"
        }, /*#__PURE__*/React.createElement("h3", null, files[i].name)), /*#__PURE__*/React.createElement("span", {
          className: "text"
        }, /*#__PURE__*/React.createElement("span", null, "PDF file")))));
      }
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "timeline"
    }, /*#__PURE__*/React.createElement("span", {
      className: "file heading"
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: "circle",
      timeline: "down"
    }), /*#__PURE__*/React.createElement("h2", null, title ? title : "Files")), children, fileTags);
  }
}
function File({
  id,
  href,
  children,
  subtext,
  fileType = "file",
  icon = "pdf",
  target = "_self"
}) {
  return /*#__PURE__*/React.createElement(Link, {
    key: id,
    href: href,
    className: fileType,
    target: target
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: icon,
    timeline: "up"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title"
  }, /*#__PURE__*/React.createElement("h3", null, children)), /*#__PURE__*/React.createElement("span", {
    className: "text"
  }, /*#__PURE__*/React.createElement("span", null, subtext))));
}
function Post({
  content
}) {
  let date = new Date(content.date);
  function handleBack(e) {
    e.preventDefault();
    history.back();
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content",
    key: `post_${content.title}`
  }, content.date && content.show_title ? /*#__PURE__*/React.createElement("h3", {
    className: "details"
  }, /*#__PURE__*/React.createElement("a", {
    href: "",
    onClick: e => {
      handleBack(e);
    }
  }, "\u25C0  Back"), /*#__PURE__*/React.createElement("span", null, content.show_title), /*#__PURE__*/React.createElement("span", null, date.toLocaleString().slice(0, -3))) : "", content.frontpage && content.show_title === content.title ? "" : /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement(Markdown, {
    className: "post_content",
    content: content.content
  }), content.files ? /*#__PURE__*/React.createElement(Files, {
    title: content.files_title,
    files: content.files
  }) : "");
}
function FilePage({
  content
}) {
  let date = new Date(content.date);
  function handleBack(e) {
    e.preventDefault();
    history.back();
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content filepage"
  }, content.date && content.show_title ? /*#__PURE__*/React.createElement("h3", {
    className: "details"
  }, /*#__PURE__*/React.createElement("a", {
    href: "",
    onClick: e => {
      handleBack(e);
    }
  }, "\u25C0  Back"), /*#__PURE__*/React.createElement("span", null, content.show_title), /*#__PURE__*/React.createElement("span", null, date.toLocaleString().slice(0, -3))) : "", /*#__PURE__*/React.createElement("h1", null, content.title.replaceAll("_", " ")), /*#__PURE__*/React.createElement("object", {
    data: content.url
  }, /*#__PURE__*/React.createElement("h4", null, "File preview not supported on your device. See Download link below."), /*#__PURE__*/React.createElement("a", {
    href: content.url,
    target: "_blank"
  }, /*#__PURE__*/React.createElement("h3", null, "Download File"))), /*#__PURE__*/React.createElement("a", {
    href: content.url,
    target: "_blank"
  }, /*#__PURE__*/React.createElement("h3", null, "Download File")));
}
function BlogPost({
  content
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "top-bar"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/blog",
    className: "svg-button"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 10 20",
    fillOpacity: "0"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m 10 0 l -10 10 l 10 10"
  })), /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, /*#__PURE__*/React.createElement("h3", null, "Back"), /*#__PURE__*/React.createElement("p", null, "to all posts"))), /*#__PURE__*/React.createElement("h1", {
    className: "post-title"
  }, content.title), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      margin: "auto"
    }
  }, /*#__PURE__*/React.createElement("h2", null, content.date), content.author)), /*#__PURE__*/React.createElement("div", {
    className: "post-content"
  }, /*#__PURE__*/React.createElement(Markdown, {
    className: "post_content",
    content: content.content
  }))));
}
function BlogPostList({
  content
}) {
  let postsObject = content.posts;
  let posts = [];
  let postKeys = Object.keys(postsObject);
  for (let i = 0; i < postKeys.length; i++) {
    let post = postsObject[postKeys[i]];
    let style = {
      order: post.dateInt
    };
    posts.push(/*#__PURE__*/React.createElement(Link, {
      key: i,
      className: "link hr_after",
      href: `/blog/${postKeys[i]}`,
      style: style
    }, /*#__PURE__*/React.createElement("b", null, post.title), ` - ${post.date} - by ${post.author}`));
  }
  let pathSplit = window.location.pathname.split("/");
  if (pathSplit.length > 2 && postKeys.includes(pathSplit[2])) {
    return /*#__PURE__*/React.createElement(BlogPost, {
      content: postsObject[pathSplit[2]]
    });
  } else if (pathSplit.length > 2) {
    return /*#__PURE__*/React.createElement(BlogPost, {
      content: {
        title: "404 Not Found",
        content: "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."
      }
    });
  } else {
    return /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement("div", {
      className: "all-posts"
    }, posts));
  }
}
function MapEmbed({
  url
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "map"
  }, /*#__PURE__*/React.createElement("iframe", {
    style: {
      border: 0
    },
    src: url,
    height: "450",
    frameBorder: "0",
    allowFullScreen: "allowfullscreen"
  }));
}
function ContactForm({}) {
  function handleSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(e.target.action, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.get('name'),
        contact: formData.get('contact'),
        subject: formData.get('subject'),
        message: formData.get('message')
      })
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        form.reset();
        displayAlerts({
          title: "Success",
          content: 'Your message has been sent successfully!'
        });
      } else {
        displayAlerts({
          title: "Error",
          content: data.msg
        });
      }
      form.querySelector("span.msg").innerHTML = data.msg;
    }).finally(() => {
      form.classList.remove("pending");
    }).catch(error => {
      console.error('Error:', error);
      alert('An unexpected error occurred. Please try again later.');
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "contact-form",
    id: "contactform"
  }, /*#__PURE__*/React.createElement("h2", null, "Contact Us"), /*#__PURE__*/React.createElement("form", {
    action: "/api/contact",
    method: "POST",
    onSubmit: e => {
      handleSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "name",
    label: "Name",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "contact",
    label: "Contact Email or Number",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "select",
    id: "subject",
    label: "Subject",
    defaultValue: "",
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }), /*#__PURE__*/React.createElement("option", {
    value: "Joining the group"
  }, "Joining the group"), /*#__PURE__*/React.createElement("option", {
    value: "Tickets"
  }, "Tickets"), /*#__PURE__*/React.createElement("option", {
    value: "Group Bookings"
  }, "Group Bookings"), /*#__PURE__*/React.createElement("option", {
    value: "Other"
  }, "Other")), /*#__PURE__*/React.createElement(Input, {
    type: "textarea",
    id: "message",
    label: "Message",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    value: "Submit"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })));
}
function PrizeDraw({}) {
  function handleFormSubmit(e) {
    let form = e.target;
    form.classList.add("pending");
    e.preventDefault();
    let formData = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: formData
    }).then(response => {
      return response.json();
    }).then(data => {
      // console.log("CODE: ", data.code)
      if (data.code === 200) {
        form.reset();
      }
      form.querySelector("span.msg").innerHTML = data.msg;
      form.querySelector("div.form").classList.add("hidden");
      form.classList.remove("pending");
    });
  }
  function handlePhoneChange(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, "Prize Draw"), /*#__PURE__*/React.createElement("p", null, "Enter your details for a change to win 2 tickets to see our next show, ", /*#__PURE__*/React.createElement("b", null, "Death by Design"), ", a comedy murder mystery."), /*#__PURE__*/React.createElement("p", null, "By entering the draw, you agree to join our audience email newsletter for about upcoming shows."), /*#__PURE__*/React.createElement("form", {
    action: "/api/prizeDraw",
    onSubmit: handleFormSubmit
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "msg"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "name",
    maxLength: 50,
    label: "Name",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "email",
    maxLength: 120,
    label: "Email",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "text",
    id: "phone_number",
    onChange: handlePhoneChange,
    maxLength: 13,
    label: "Phone Number",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    type: "submit",
    value: "Submit"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  })));
}
function Redirect({
  url,
  text = "the destination"
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h3", null, "You will be redirected to ", text.toLowerCase(), " in 5 seconds. If this doesn't work, press the button below"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "quick-button",
    onClick: () => {
      window.location.href = `${url}`;
    }
  }, "Go to ", text), /*#__PURE__*/React.createElement("meta", {
    httpEquiv: "refresh",
    content: `0;url=${url}`
  }));
}

"use strict";

const appRoot = ReactDOM.createRoot(document.getElementById('app'));
appRoot.render(/*#__PURE__*/React.createElement(App, null));
const app = React.createContext();
function App() {
  let defaultPostPath = document.querySelector("#app").dataset.path;
  const [memberNavItemsToShow, setMemberNavItemsToShow] = React.useState({});
  const [postJson, setPostJson] = React.useState(document.querySelector("#app").dataset.data || "{}");
  const [content, setContent] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [sidebarData, setSidebarData] = React.useState([]);
  const [sidebarExtras, setSidebarExtras] = React.useState([]);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const [siteJson, setSiteJson] = React.useState({});
  const [pathState, setPathState] = React.useState(window.location.pathname);
  const [pathHistory, setPathHistory] = React.useState([window.location.pathname]);
  const [pathIncrementer, setPathIncrementer] = React.useState(0);
  const [popstateEvents, setPopstateEvents] = React.useState([]);
  const CART_TTL = 24 * 60 * 60 * 1000; // 24 hours
  // const CART_TTL = 1 * 1 * 60 * 1000 // 1 minute

  function loadCart() {
    try {
      const raw = localStorage.getItem("ticketsCart");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed.savedAt || !parsed.cart) return {};
      if (Date.now() - parsed.savedAt > CART_TTL) {
        localStorage.removeItem("ticketsCart");
        return {};
      }
      return parsed.cart;
    } catch {
      return {};
    }
  }
  const [ticketsCart, setTicketsCart] = React.useState(loadCart);
  React.useEffect(() => {
    localStorage.setItem("ticketsCart", JSON.stringify({
      savedAt: Date.now(),
      cart: ticketsCart
    }));
  }, [ticketsCart]);
  let path = window.location.pathname;
  React.useEffect(() => {
    if (popstateEvents.length) {
      const debounceTimer = setTimeout(() => {
        let event = popstateEvents[0];
        setPathState(window.location.pathname);
        setPathIncrementer(pathIncrementer + 1);
        setPopstateEvents([]);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [popstateEvents]);
  React.useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState("", "", pathState);
    }
    getSiteJson();
  }, []);
  React.useEffect(() => {
    if (pathState !== pathHistory[-1]) {
      let tempHistory = [...pathHistory];
      tempHistory.push(pathState);
      setPathHistory(tempHistory);
    }
    let data = [];
    // TICKETS
    if (siteJson.tickets_active === "1") {
      data.push({
        type: "simple",
        title: `${siteJson.next_show.title} - Tickets Available`,
        icon: "ticket",
        link: "/tickets",
        linkText: "Purchase Tickets",
        target: "_blank"
      });
    }
    data.push({
      type: "cart"
    }); // TODO: move up

    // copenhagen tickets
    const currentDate = new Date().getTime();
    if (currentDate < Date.parse("2026-02-24T19:30:00Z")) {
      data.push({
        type: "simple",
        title: "Copenhagen - A Silchester Players Special",
        icon: "ticket",
        link: "https://silchester-players.square.site/shop/copenhagen-a-silchester-players-special/G3TCW5JOXYQ3LQY7BPQGD4KR",
        linkText: "Copenhagen - Tickets Available",
        target: "_blank"
      });
    }

    // AUDITIONS
    const auditions_date = Date.parse(siteJson.auditions_date);
    if (siteJson.show_auditions && auditions_date > currentDate) {
      data.push({
        type: "simple",
        title: `${siteJson.show_auditions} - Auditions`,
        icon: "theater_comedy",
        link: "/auditions",
        linkText: "See Full Details",
        target: "_self"
      });
    }

    // MEMBER DOCS
    if (RegExp("^/members/", "i").test(pathState) && siteJson.memberDocs) {
      data.push({
        type: "raw",
        raw: /*#__PURE__*/React.createElement(Post, {
          content: siteJson.memberDocs
        })
      });
    }

    // CONTACT FORM
    if (RegExp("^/(about|auditions|tickets)", "i").test(pathState)) {
      // console.log("CONTACT FORM")
      data.push({
        type: "raw",
        raw: /*#__PURE__*/React.createElement(ContactForm, null)
      });
    }

    // SOCIALS
    if (siteJson.socials) {
      let socials = [];
      let raw_socials = siteJson.socials.split(",");
      for (let i = 0; i < raw_socials.length; i++) {
        if (raw_socials[i].includes("|")) {
          let [a, b] = raw_socials[i].split("|", 2);
          let icon = "other_icon";
          if (a.toLowerCase().includes("newsletter")) {
            icon = "email_icon";
          }
          socials.push({
            type: "social",
            linkText: decodeURIComponent(a),
            class: "other",
            icon: icon,
            link: b
          });
        } else if (raw_socials[i].includes("facebook")) {
          socials.push({
            type: "social",
            linkText: "Facebook",
            class: "facebook",
            icon: "fb_icon",
            link: raw_socials[i]
          });
        } else if (raw_socials[i].includes("twitter")) {
          socials.push({
            type: "social",
            linkText: "Twitter",
            class: "twitter",
            icon: "tw_icon",
            link: raw_socials[i]
          });
        } else if (raw_socials[i].includes("instagram")) {
          socials.push({
            type: "social",
            linkText: "Instagram",
            class: "instagram",
            icon: "ig_icon",
            link: raw_socials[i]
          });
        } else {
          const url = new URL(raw_socials[i]);
          const netloc = url.hostname;
          socials.push({
            type: "social",
            linkText: netloc,
            class: "other",
            icon: "other_icon",
            link: raw_socials[i]
          });
        }
      }
      if (socials.length > 0) {
        data.push({
          type: "socials",
          title: "Socials: ",
          socials: socials
        });
      }
    }
    // LAST SHOW
    if (siteJson.last_show) {
      data.push({
        type: siteJson.last_show.photos.length ? "simple_photos" : "simple",
        title: "Our Last Show",
        icon: "drama",
        link: siteJson.last_show.link,
        linkText: siteJson.last_show.title,
        photos: siteJson.last_show.photos
      });
    }
    // BLOG
    if (siteJson.latest_blog) {
      data.push({
        type: "simple",
        title: `Latest Blog: ${siteJson.latest_blog.date}`,
        icon: "drama",
        link: siteJson.latest_blog.link,
        linkText: siteJson.latest_blog.title
      });
    }
    if (siteJson.memberNavItemsToShow) {
      setMemberNavItemsToShow({
        ...siteJson.memberNavItemsToShow
      });
    }
    setSidebarData([...data]);
  }, [siteJson, pathState, pathIncrementer]);
  React.useEffect(() => {
    if (["/", "/auditions", "/about-us", "/search", "/past-shows", "/members", "/members/logout"].includes(pathState)) {
      getPostJson(pathState + "?" + window.location.search.replace("?", "") + "&react");
    } else if (["/members/get_sums", "/members/dashboard", "/members/account_settings", "/members/admin/admin_settings", "/members/bookings"].includes(pathState)) {
      getPostJson(pathState + "?" + window.location.search.replace("?", "") + "&react");
    } else if (RegExp("^/blog", "i").test(pathState)) {
      getPostJson("/blog?react");
    } else if (RegExp("^/post/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
    } else if (RegExp("^/past-shows/([A-Za-z0-9-_]{15,16})/.+", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
    } else if (RegExp("^/past-shows/member/([A-Za-z0-9-_]{15,16})/.+", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
    } else if (RegExp("^(/members/|/)file/([A-Za-z0-9-_]{15,16})/(.+)", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
    } else if (RegExp("^(/members/|/)post/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
    } else if (RegExp("^/members/bookings/seating/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
    } else if (path === "/members/docs") {
      getPostJson(pathState + `?react`);
    } else if (path === "/members/shows") {
      if (siteJson.members_recent_shows) {
        setPostJson({
          type: "members_shows",
          title: "Shows:",
          shows: siteJson.members_recent_shows
        });
      }
    } else if (RegExp("^/members/show/([A-Za-z0-9-_]{15,16})", "i").test(pathState)) {
      getPostJson(pathState + `?react`);
      // } else if (path === "/tickets") {
      // 	// TODO: NEW TICKETS GO HERE
      // 	getPostJson(pathState + `?react`)
    } else if (path === "/tickets") {
      setPostJson({
        type: "ticket_store",
        title: "Tickets Store"
      });
      // getPostJson(pathState + `?react`)
    } else if (path === "/tickets/cart") {
      setPostJson({
        type: "ticket_cart",
        title: "Tickets Cart"
      });
    } else if (path === "/tickets/checkout") {
      setPostJson({
        type: "ticket_checkout",
        title: "Tickets Checkout"
      });
    } else if (path.split("?")[0] === "/tickets/checkout/success") {
      setPostJson({
        type: "ticket_success",
        title: "Purchase Successful"
      });
    } else {
      getPostJson(pathState + `?react`);
    }
  }, [pathState, pathIncrementer, siteJson]);
  React.useEffect(() => {
    if (Object.keys(siteJson).length) {
      let tempContent = [];
      let tempSidebarExtras = [];
      setShowSidebar(true);

      // Post type
      if (postJson.type === "post") {
        tempContent.push(/*#__PURE__*/React.createElement(Post, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "blog_post") {
        tempContent.push(/*#__PURE__*/React.createElement(BlogPost, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "blogs") {
        tempContent.push(/*#__PURE__*/React.createElement(BlogPostList, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "map_post") {
        tempContent.push(/*#__PURE__*/React.createElement(Post, {
          key: tempContent.length,
          content: postJson
        }));
        tempSidebarExtras.push(/*#__PURE__*/React.createElement(MapEmbed, {
          key: tempSidebarExtras.length,
          url: postJson.maps_url
        }));
      } else if (postJson.type === "search") {
        tempContent.push(/*#__PURE__*/React.createElement(Search, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "prize_draw") {
        tempContent.push(/*#__PURE__*/React.createElement(PrizeDraw, {
          key: tempContent.length
        }));
      } else if (postJson.type === "list_shows") {
        tempContent.push(/*#__PURE__*/React.createElement(ListShows, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "past_show") {
        tempContent.push(/*#__PURE__*/React.createElement(ShowPage, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "file_page") {
        tempContent.push(/*#__PURE__*/React.createElement(FilePage, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "login") {
        tempContent.push(/*#__PURE__*/React.createElement(Login, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "error") {
        tempContent.push(/*#__PURE__*/React.createElement(ErrorComponent, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "dashboard") {
        tempContent.push(/*#__PURE__*/React.createElement(Dashboard, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "members_shows") {
        tempContent.push(/*#__PURE__*/React.createElement(Shows, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "members_show") {
        tempContent.push(/*#__PURE__*/React.createElement(Show, {
          key: tempContent.length,
          content: postJson,
          refresh: getPostJson
        }));
      } else if (postJson.type === "account_settings") {
        tempContent.push(/*#__PURE__*/React.createElement(AccountSettings, {
          key: tempContent.length,
          content: postJson,
          refresh: () => getPostJson(pathState)
        }));
      } else if (postJson.type === "admin_settings") {
        tempContent.push(/*#__PURE__*/React.createElement(AdminSettings, {
          key: tempContent.length,
          content: postJson,
          refresh: () => getPostJson(pathState)
        }));
      } else if (postJson.type === "manage_media") {
        tempContent.push(/*#__PURE__*/React.createElement(ManageMedia, {
          key: tempContent.length,
          content: postJson,
          refresh: () => getPostJson(pathState)
        }));
      } else if (postJson.type === "edit_show") {
        tempContent.push(/*#__PURE__*/React.createElement(EditShow, {
          key: tempContent.length,
          content: postJson,
          refresh: () => getPostJson(pathState)
        }));
      } else if (postJson.type === "manage_show_photos") {
        tempContent.push(/*#__PURE__*/React.createElement(PastShowPhotos, {
          key: tempContent.length,
          content: postJson,
          refresh: () => getPostJson(pathState)
        }));
      } else if (postJson.type === "show_photos_form") {
        tempContent.push(/*#__PURE__*/React.createElement(ShowPhotosForm, {
          key: tempContent.length,
          content: postJson,
          refresh: () => getPostJson(pathState)
        }));
      } else if (postJson.type === "accounting") {
        tempContent.push(/*#__PURE__*/React.createElement(Accounting, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "get_subs") {
        tempContent.push(/*#__PURE__*/React.createElement(GetSubs, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "bookings") {
        tempContent.push(/*#__PURE__*/React.createElement(ManageBookings, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "seating") {
        setShowSidebar(false);
        tempContent.push(/*#__PURE__*/React.createElement(SeatingPlanner, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "ticket_store") {
        tempContent.push(/*#__PURE__*/React.createElement(TicketStore, {
          key: tempContent.length,
          ticketsActive: siteJson.tickets_active
        }));
      } else if (postJson.type === "ticket_checkout") {
        tempContent.push(/*#__PURE__*/React.createElement(Checkout, {
          key: tempContent.length,
          ticketsActive: siteJson.tickets_active
        }));
      } else if (postJson.type === "ticket_success") {
        tempContent.push(/*#__PURE__*/React.createElement(CheckoutSuccess, {
          key: tempContent.length,
          ticketsActive: siteJson.tickets_active
        }));
      } else if (postJson.type === "error") {
        tempContent.push(/*#__PURE__*/React.createElement(Post, {
          key: tempContent.length,
          content: postJson
        }));
      } else if (postJson.type === "redirect") {
        if (postJson.reloadSiteData) {
          getSiteJson();
        }
        if (postJson.url.includes(window.location.origin) || !postJson.url.includes("http")) {
          window.history.pushState("", "", postJson.url);
          setPathState(postJson.url);
        } else {
          tempContent.push(/*#__PURE__*/React.createElement(Redirect, {
            key: tempContent.length,
            url: postJson.url,
            text: postJson.text
          }));
        }
      }

      // FRONTPAGE
      if (postJson.frontpage) {
        tempContent = [/*#__PURE__*/React.createElement(Frontpage, {
          nextShow: siteJson.next_show,
          key: siteJson.next_show.title
        }, tempContent)];
      }
      // console.log("redraw content")
      setContent(tempContent);
      setSidebarExtras(tempSidebarExtras);
    }
  }, [postJson, siteJson]);
  function setPath(newPath) {
    setPathState(newPath);
    setPathIncrementer(pathIncrementer + 1);
    window.history.pushState("", "", newPath);
  }
  function getPostJson(url) {
    // console.log("GET POST JSON")
    // console.log(url)
    if (defaultPostPath !== url) {
      const response = fetch(url).then(response => response.json()).then(data => {
        setPostJson({
          ...data,
          requestURL: url,
          requestTime: Date.now()
        });
      });
    }
  }
  function refresh(withSiteData = false) {
    if (withSiteData) {
      getSiteJson();
      setPathIncrementer(pathIncrementer + 1);
    } else {
      getPostJson(pathState);
      setPathIncrementer(pathIncrementer + 1);
    }
  }
  function getSiteJson() {
    const response = fetch("/sitedata").then(response => response.json()).then(data => {
      setSiteJson({
        ...data
      });
    });
  }
  window.addEventListener('popstate', event => {
    setPopstateEvents([...popstateEvents, event]);
  });
  return /*#__PURE__*/React.createElement(app.Provider, {
    value: {
      siteJson,
      ticketsCart,
      functions: {
        setPath,
        refresh,
        setTicketsCart
      }
    }
  }, /*#__PURE__*/React.createElement(AlertsContainer, null), /*#__PURE__*/React.createElement(Nav, {
    navItems: navItems,
    memberNavItemsToShow: memberNavItemsToShow,
    siteName: siteJson.site_name,
    logoSVG: siteJson.logoSVG
  }, /*#__PURE__*/React.createElement("div", {
    className: "main-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "banner",
    id: "banner"
  }), content, /*#__PURE__*/React.createElement(Sidebar, {
    show: showSidebar,
    sidebarItems: sidebarData,
    extras: sidebarExtras
  }))));
}

"use strict";

const testResults = {
  type: "search",
  title: "Search",
  items: [{
    type: "blog",
    href: "/blog/kTeNqg0P46DVjKs",
    title: "Another Coat of Paint"
  }, {
    type: "show",
    href: "/past-shows/3XhG5bvzFbsSKzp/Rapunzel",
    title: "Rapunzel"
  }, {
    type: "member",
    href: "/past-shows/u/r5zwBgKQjl7Kesy/Tim-Oliver",
    title: "Tim Oliver"
  }, {
    type: "post",
    href: "/post/ALYOCGlZ6PTCGSh",
    title: "Tim Oliver"
  }]
};
function Search({
  content = testResults
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [results, setResults] = React.useState([]);
  // content = testResults

  function handleInput(e) {
    setSearchTerm(e.target.value);
  }
  React.useEffect(() => {
    let tempResults = [];
    if (searchTerm) {
      let searchTerms = searchTerm.toLowerCase().split(",");
      content.items.filter(item => {
        let searchable = [item.title, item.type].join(" ").toLowerCase();
        let searchIndexes = [];
        searchTerms.filter(term => {
          let index = searchable.indexOf(term);
          if (index > -1) {
            searchIndexes.push(index);
          }
        });
        if (searchIndexes.length) {
          let order = Math.hypot(...searchIndexes) * (1 + searchTerms.length - searchIndexes.length);
          tempResults.push(/*#__PURE__*/React.createElement(SearchResult, {
            item: item,
            order: order
          }));
        }
      });
    }
    setResults(tempResults);
  }, [searchTerm]);
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h1", null, content.title), /*#__PURE__*/React.createElement(Input, {
    label: "Search",
    className: "search",
    type: "text",
    onInput: e => {
      handleInput(e);
    }
  }), /*#__PURE__*/React.createElement("h2", null, "Results (", results.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "results"
  }, results));
}
function SearchResult({
  item,
  order
}) {
  let iconMap = {
    blog: "blog_icon",
    show: "drama",
    member: "person",
    post: "note"
  };
  function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
  }
  return /*#__PURE__*/React.createElement(Link, {
    className: "result",
    href: item.href,
    style: {
      order: order
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: iconMap[item.type]
  }), capitalize(item.type), ": ", item.title);
}

"use strict";

let initialAssignment = {
  "A9": 1,
  "A10": 0,
  "A8": 1
};
let initialHiddenSeats = ["A6", "A7", "I1", "I12", "I6", "I7"];
const DummyOrders = {
  0: {
    name: "Chris P. Bacon",
    seats: 3,
    note: "Aisle seat for my husbands bad leg please",
    adults: 3,
    children: 0
  },
  1: {
    name: "Justin Case",
    seats: 4,
    note: "",
    adults: 3,
    children: 1
  },
  2: {
    name: "Carol Singer",
    seats: 2,
    note: "",
    adults: 2,
    children: 0
  }
};
const rootElem = document.getElementById('seating-plan');
if (rootElem) {
  const root = ReactDOM.createRoot(rootElem);
  const layout = JSON.parse(rootElem.dataset.layout);
  const initialAssignments = JSON.parse(rootElem.dataset.assignments);
  root.render(/*#__PURE__*/React.createElement(SeatingPlan, {
    defaultRowCount: layout.rowCount,
    showName: rootElem.dataset.showname,
    authors: rootElem.dataset.authors,
    date: rootElem.dataset.date,
    initialAssignment: initialAssignments,
    initialHiddenSeats: layout.hiddenSeats
  }));
}
const itemCounter = (value, index) => {
  return value.filter(x => x == index).length;
};
function int(str) {
  if (str === undefined) {
    return undefined;
  }
  return parseInt(str, 10);
}
function SeatingPlanner({
  content
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "content wide"
  }, /*#__PURE__*/React.createElement(SeatingPlan, {
    defaultRowCount: content.defaultRowCount,
    initialAssignment: content.initialAssignment,
    initialHiddenSeats: content.initialHiddenSeats,
    date: content.date,
    showName: content.showName,
    authors: content.authors
  }));
}
function SeatingPlan({
  defaultRowCount,
  initialAssignment,
  initialHiddenSeats,
  initialPricing,
  date,
  showName,
  authors
}) {
  const context = React.useContext(app);
  const [rowCount, setRowCount] = React.useState(defaultRowCount);
  const [assignments, setAssignments] = React.useState(initialAssignment);
  const [ticketPricing, setTicketPricing] = React.useState(initialPricing);
  const [showPricingPopup, setShowPricingPopup] = React.useState(false);
  const [previewAssignments, setPreviewAssignments] = React.useState({});
  let rows = [];
  let assignedOrders = [];
  let unassignedOrders = [];
  const fullWidth = 12;
  date = getPerfDateString(date);
  const [hiddenSeats, setHiddenSeats] = React.useState(initialHiddenSeats);
  const [orders, setOrders] = React.useState({});
  const [soldSeatCount, setSoldSeatCount] = React.useState(0);
  const [dragResize, setDragResize] = React.useState("");
  // const orders = {...DummyOrders}

  React.useEffect(() => {
    getOrders();
    new TomSelect("#hiddenSeatSelect", {
      maxItems: 200,
      allowEmptyOption: true,
      hidePlaceholder: false,
      items: hiddenSeats,
      onItemAdd: function () {
        this.setTextboxValue('');
        this.refreshOptions();
      }
    });
  }, []);
  function fourColour() {
    let highestColourNum = 0;
    let colourMap = {};
    let reverseAssignments = {};
    for (let i = 0; i < rowCount; i++) {
      for (let j = 1; j <= fullWidth; j++) {
        let seat = `${String.fromCharCode(65 + i)}${j}`;
        let order_id = int(assignments[seat]);
        if (order_id !== undefined) {
          if (reverseAssignments[order_id] === undefined) {
            reverseAssignments[order_id] = [seat];
          } else {
            reverseAssignments[order_id].push(seat);
          }
        }
      }
    }
    for (let i = 0; i < Object.keys(reverseAssignments).length; i++) {
      let neighbourOrders = [];
      let targetOrderID = int(Object.keys(reverseAssignments)[i]);
      for (let j = 0; j < reverseAssignments[targetOrderID].length; j++) {
        let seats = reverseAssignments[targetOrderID];
        let letterVal = seats[j].charCodeAt(0);
        let number = int(seats[j].substring(1));
        if (letterVal > 65) {
          //up
          let tempSeat = `${String.fromCharCode(letterVal - 1)}${number}`;
          let temp = int(assignments[tempSeat]);
          if (![targetOrderID, undefined].includes(temp)) {
            neighbourOrders.push(temp);
          }
        }
        if (number > 1) {
          //left
          let tempSeat = `${String.fromCharCode(letterVal)}${number - 1}`;
          let temp = int(assignments[tempSeat]);
          if (![targetOrderID, undefined].includes(temp)) {
            neighbourOrders.push(temp);
          }
        }
        if (letterVal < 65 + rowCount - 1) {
          // down
          let tempSeat = `${String.fromCharCode(letterVal + 1)}${number}`;
          let temp = int(assignments[tempSeat]);
          if (![targetOrderID, undefined].includes(temp)) {
            neighbourOrders.push(temp);
          }
        }
        if (number < fullWidth) {
          // right
          let tempSeat = `${String.fromCharCode(letterVal)}${number + 1}`;
          let temp = int(assignments[tempSeat]);
          if (![targetOrderID, undefined].includes(temp)) {
            neighbourOrders.push(temp);
          }
        }
      }
      let neighbourColourIDs = [];
      for (let x = 0; x < neighbourOrders.length; x++) {
        neighbourColourIDs.push(colourMap[neighbourOrders[x]]);
      }
      let existingNonNeighbourColours = Object.values(colourMap).filter(x => !neighbourColourIDs.includes(x));
      let newColour = existingNonNeighbourColours.toSorted()[0];
      // console.log(orders[target_order_id].name, target_order_id, left_order_id, newColour)
      colourMap[targetOrderID] = newColour !== undefined ? newColour : highestColourNum++;
    }

    // console.log("map", colourMap)
    let colourIDs = [...new Set(Object.values(colourMap))];
    // console.log("ids", colourIDs)
    let colours = {};
    for (let i = 0; i < colourIDs.length; i++) {
      colours[colourIDs[i]] = `${360 * i / colourIDs.length}`;
    }
    return [colours, colourMap, reverseAssignments];
  }
  const [colours, colourMap, reverseAssignments] = fourColour();
  function save(e) {
    e.preventDefault();
    let newSeats = 0;
    for (let i = 0; i < unassignedOrders.length; i++) {
      newSeats += unassignedOrders[i].props.order.seats - itemCounter(Object.values(assignments), unassignedOrders[i].order_id);
    }
    const response = fetch(window.location.pathname, {
      method: "POST",
      mode: "same-origin",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        layout: {
          rowCount: rowCount,
          hiddenSeats: hiddenSeats,
          newSeats: newSeats,
          fullWidth: fullWidth
        },
        assignments: assignments,
        ticket_pricing: ticketPricing // TODO: add frontend and backend for ticket pricing
      })
    }).then(response => {
      return response.json();
    }).then(data => {
      if (data.code === 200) {
        displayAlerts([{
          title: data.msg,
          content: ""
        }]);
        return false;
      } else {
        displayAlerts([{
          title: "Something went wrong.",
          content: ""
        }]);
        return false;
      }
    }).catch(e => {
      displayAlerts([{
        title: "Something went wrong.",
        content: e
      }]);
      return false;
    });
  }
  function getOrders() {
    fetch(`/members/api/orders/${showName}/${date}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        mode: "same-origin",
        cache: "no-cache"
      }
    }).then(response => {
      response.json().then(orders_api => {
        let newOrders = {};
        let seats = 0;
        for (let i = 0; i < orders_api.length; i++) {
          let order = orders_api[i];
          seats = seats + order.tickets_count;
          newOrders[order.ref] = {
            name: order.name,
            seats: order.tickets_count,
            note: order.note,
            tickets: order.tickets
            // adults: order.tickets.Adult !== undefined ? order.tickets.Adult : 0,
            // children: order.tickets.Junior !== undefined ? order.tickets.Junior : 0
          };
        }
        setOrders({
          ...newOrders
        });
        setSoldSeatCount(seats);
      });
    });
  }
  function reportNewAssignment(seatNumber, orderID, oldSeat = "") {
    let failFlag = false;
    let newAssignments = {
      ...assignments
    };
    if (typeof seatNumber === typeof [] && typeof orderID === typeof []) {
      for (let i = 0; i < seatNumber.length; i++) {
        if (orderID[i] === "" || orderID[i] === undefined) {
          delete newAssignments[seatNumber[i]];
        } else {
          newAssignments[seatNumber[i]] = orderID[i];
        }
      }
    } else if (typeof seatNumber === typeof []) {
      let alreadyAssignedCount = itemCounter(Object.values(assignments), orderID);
      for (let i = 0; i < seatNumber.length; i++) {
        if (orderID === undefined || alreadyAssignedCount + i < orders[orderID].seats) {
          newAssignments[seatNumber[i]] = orderID;
        } else {
          displayAlerts([{
            title: "No Seats Remaining",
            content: "You have already assigned all the seats for this order."
          }]);
          failFlag = true;
        }
      }
    } else {
      if (oldSeat !== "" || orderID === undefined) {
        delete newAssignments[oldSeat !== "" ? oldSeat : seatNumber];
      }
      if (orderID !== undefined) {
        if (oldSeat !== "" || itemCounter(Object.values(assignments), orderID) < orders[orderID].seats) {
          newAssignments[seatNumber] = orderID;
        } else {
          displayAlerts([{
            title: "No Seats Remaining",
            content: "You have already assigned all the seats for this order."
          }]);
          failFlag = true;
        }
      }
    }
    setAssignments({
      ...newAssignments
    });
  }
  for (let i = 0; i < rowCount; i++) {
    let rowLetter = String.fromCharCode(65 + i);
    let innerAisleSeats = 0 < i && i < rowCount - 1;
    let outerAisleSeats = i < rowCount - 1;
    rows.push(/*#__PURE__*/React.createElement(Row, {
      key: rowLetter,
      rowLetter: rowLetter,
      fullWidth: fullWidth,
      hasInsideAisleSeats: innerAisleSeats,
      hasOutsideAisleSeats: outerAisleSeats,
      assignments: assignments,
      reportNewAssignmentPlan: reportNewAssignment,
      orders: orders,
      hiddenSeats: hiddenSeats,
      previewAssignments: previewAssignments,
      setPreviewAssignments: setPreviewAssignments,
      dragResize: dragResize,
      setDragResize: setDragResize,
      colours: colours,
      colourMap: colourMap
    }));
  }
  let tickets_buckets = {};
  for (let i = 0; i <= 26; i++) {
    tickets_buckets[i] = [];
  }
  let tickets = [];
  for (let [order_id, order] of Object.entries(orders)) {
    let seats_assigned = itemCounter(Object.values(assignments), order_id);
    let newOrder = /*#__PURE__*/React.createElement(Order, {
      key: "order" + order_id,
      order_id: order_id,
      order: order,
      seats_assigned: seats_assigned
    });
    let seats = reverseAssignments[order_id] !== undefined ? reverseAssignments[order_id] : [];
    let newTicket = /*#__PURE__*/React.createElement(Ticket, {
      groupName: context.siteJson.site_name,
      showDate: date,
      showName: showName,
      authors: authors,
      name: order.name,
      seats: seats
    });
    let bucket_lookup = order.name.toLowerCase().split(" ").slice(-1)[0].charCodeAt(0) - 96;
    if (!(1 <= bucket_lookup && bucket_lookup <= 26)) {
      bucket_lookup = 0;
    }
    // console.log(order.name, bucket_lookup)
    if (order.seats) {
      tickets_buckets[bucket_lookup].push(newTicket);
      if (seats_assigned < order.seats) {
        unassignedOrders.push(newOrder);
      } else {
        assignedOrders.push(newOrder);
      }
    }
  }
  for (let i = 1; i <= 26; i++) {
    tickets.push(...tickets_buckets[i]);
  }
  let seatOptions = [];
  for (let row = 0; row < rowCount; row++) {
    let letter = String.fromCharCode(65 + row);
    for (let seat = 1; seat <= fullWidth; seat++) {
      let seatNumber = `${letter}${seat}`;
      seatOptions.push(/*#__PURE__*/React.createElement("option", {
        value: seatNumber
      }, seatNumber));
    }
  }
  function handleHiddenSeatSelect(e) {
    let newHiddenSeats = e.target.tomselect.getValue(0);
    setHiddenSeats([...newHiddenSeats]);
  }
  function togglePricingPopup(event) {
    event.preventDefault();
    setShowPricingPopup(!showPricingPopup);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "seating-planner"
  }, /*#__PURE__*/React.createElement("div", {
    className: `ticketPricingPopupContainer ${showPricingPopup ? 'show' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "ticketPricingPopup"
  }, /*#__PURE__*/React.createElement("span", {
    className: "popupTitle"
  }, /*#__PURE__*/React.createElement("h2", null, "Set Pricing for this Performance"), /*#__PURE__*/React.createElement(Icon, {
    icon: "cross",
    onClick: e => togglePricingPopup(e)
  })), /*#__PURE__*/React.createElement("p", null, "Pricing for tickets can be configured below. Adjust the ticket prices as needed for this specific performance to align with your pricing strategy. Modify and save the changes to apply updates."))), /*#__PURE__*/React.createElement("div", {
    className: "controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rows"
  }, /*#__PURE__*/React.createElement("h2", null, "Show Date: ", date), /*#__PURE__*/React.createElement("h2", null, "Rows: ", /*#__PURE__*/React.createElement("strong", {
    onClick: () => setRowCount(rowCount - 1)
  }, "-"), " ", rowCount, " ", /*#__PURE__*/React.createElement("strong", {
    onClick: () => setRowCount(rowCount + 1)
  }, "+"))), /*#__PURE__*/React.createElement("div", {
    className: "rows"
  }, /*#__PURE__*/React.createElement("select", {
    id: "hiddenSeatSelect",
    onChange: e => handleHiddenSeatSelect(e),
    placeholder: "Select seats to hide"
  }, seatOptions), /*#__PURE__*/React.createElement("button", {
    className: "setPricingButton",
    onClick: e => togglePricingPopup(e)
  }, "Set Pricing")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Assigned: ", Object.values(assignments).filter(Boolean).length, "/", fullWidth * rowCount - hiddenSeats.length), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      save(e);
    },
    className: "button"
  }, "Save"))), /*#__PURE__*/React.createElement("div", {
    className: "seats-container"
  }, rows), /*#__PURE__*/React.createElement("div", {
    className: "orders"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "order-summary"
  }, "Orders: ", unassignedOrders.length + assignedOrders.length, " - Seats: ", soldSeatCount), /*#__PURE__*/React.createElement("h2", null, "New Orders:"), unassignedOrders, /*#__PURE__*/React.createElement("h2", null, "Seated Orders:"), assignedOrders), /*#__PURE__*/React.createElement("div", {
    className: "tickets",
    style: {
      width: `calc(${fullWidth + 2} * 5.7rem - sqrt(2)*2rem)`
    }
  }, tickets));
}
function Order({
  order_id,
  order,
  seats_assigned
}) {
  let seats = [];
  function handleDragStart(e, data) {
    e.dataTransfer.setData("text/plain", `new,,${data}`);
  }
  let classname = "order";
  if (order.seats === seats_assigned) {
    classname = classname + " seated";
  }
  if (order.note) {
    classname = classname + " has_note";
  }
  let ticket_types = Object.keys(order.tickets);
  for (let i = 0; i < ticket_types.length; i++) {
    seats.push(`${ticket_types[i]}: ${order.tickets[ticket_types[i]]}`);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: classname,
    "data-order-id": order_id,
    draggable: true,
    onDragStart: e => handleDragStart(e, `${order_id}`)
  }, /*#__PURE__*/React.createElement("h2", {
    className: "num"
  }, /*#__PURE__*/React.createElement("span", null, order.seats - seats_assigned)), /*#__PURE__*/React.createElement("h3", {
    className: "name"
  }, order.name), /*#__PURE__*/React.createElement("span", {
    className: "seats"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bold"
  }), seats.join(", ")), /*#__PURE__*/React.createElement("span", {
    className: "note",
    title: order.note
  }, order.note));
}
function Row({
  rowLetter,
  fullWidth,
  hasInsideAisleSeats = true,
  hasOutsideAisleSeats = true,
  assignments,
  reportNewAssignmentPlan,
  orders,
  hiddenSeats,
  previewAssignments,
  setPreviewAssignments,
  dragResize,
  setDragResize,
  colours,
  colourMap
}) {
  function reportNewAssignmentRow(seatNum, orderID, oldSeat) {
    reportNewAssignmentPlan(seatNum, orderID, oldSeat);
  }
  let seats = [];
  let seatCount = 0;
  const innerAisleSeatNums = [6, 7];
  const outerAisleSeatNums = [1, 12];
  for (let i = 1; i <= fullWidth; i++) {
    // let seatExists = (!(innerAisleSeatNums.includes(i))||hasInsideAisleSeats) && (!(outerAisleSeatNums.includes(i))||hasOutsideAisleSeats)
    let seatExists = !hiddenSeats.includes(`${rowLetter}${i}`);
    if (seatExists) {
      seatCount++;
    }
    seats.push(/*#__PURE__*/React.createElement(Seat, {
      key: `${rowLetter}${i}`,
      rowLetter: rowLetter,
      seatNumber: i,
      exists: seatExists,
      fullWidth: fullWidth,
      order_id: assignments[`${rowLetter}${i}`],
      assignments: assignments,
      reportNewAssignmentRow: reportNewAssignmentRow,
      orders: orders,
      previewAssignments: previewAssignments,
      setPreviewAssignments: setPreviewAssignments,
      dragResize: dragResize,
      setDragResize: setDragResize,
      colours: colours,
      colourMap: colourMap
    }));
    if (i === fullWidth / 2) {
      for (let i = 0; i < 2; i++) {
        seats.push(/*#__PURE__*/React.createElement(Seat, {
          key: `${rowLetter}aisle${i}`,
          rowLetter: rowLetter,
          seatNumber: "aisle",
          exists: false
        }));
      }
    }
  }
  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gridTemplateColumns: `repeat(${fullWidth + 2}, 5.7rem)`
    },
    onDragOver: e => handleDragOver(e)
  }, seats);
}
function Seat({
  rowLetter,
  seatNumber,
  exists = true,
  fullWidth,
  order_id,
  orders,
  assignments,
  reportNewAssignmentRow,
  previewAssignments,
  setPreviewAssignments,
  dragResize,
  setDragResize,
  colours,
  colourMap
}) {
  function handleDragStart(e) {
    if (e.target.className.includes("resize")) {
      e.dataTransfer.setData("text/plain", `resize,${e.target.dataset.direction},${order_id}`);
      setDragResize(`${e.target.dataset.direction},${order_id}`);
    } else {
      e.dataTransfer.setData("text/plain", `move,${rowLetter}${seatNumber},${order_id}`);
    }
  }
  function handleDrop(e) {
    let [type, arg, order_num] = e.dataTransfer.getData("text/plain").split(',');
    if (type === "move") {
      reportNewAssignmentRow(`${rowLetter}${seatNumber}`, Number(order_num), arg);
    } else if (type !== "resize") {
      reportNewAssignmentRow(`${rowLetter}${seatNumber}`, Number(order_num));
    }
  }
  function handleRemove(e) {
    if (!e.shiftKey) {
      reportNewAssignmentRow(`${rowLetter}${seatNumber}`, undefined);
    } else {
      let seatGroup = [];
      for (let i = 1; i <= fullWidth; i++) {
        if (parseInt(assignments[`${rowLetter}${i}`], 10) === order_id) {
          seatGroup.push(`${rowLetter}${i}`);
        } else if (i < seatNumber) {
          seatGroup = [`${rowLetter}${seatNumber}`];
        } else {
          break;
        }
      }
      reportNewAssignmentRow(seatGroup, undefined);
    }
  }
  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }
  function handleDragEnter(e) {
    if (e.target.nodeName === "DIV" && dragResize !== "" && e.pageX !== 0) {
      let [dir, order_num] = dragResize.split(',');
      let seatString = `${rowLetter}${seatNumber}`;
      let previewCopy = {
        ...previewAssignments
      };
      if (e.target.dataset.order_id === order_num) {
        previewCopy[seatString] = "";
      } else {
        previewCopy[seatString] = parseInt(order_num, 10);
      }
      setPreviewAssignments(previewCopy);
    }
  }
  // todo: change to by mouse position for improved reliability
  function handleDragLeave(e) {
    if (e.relatedTarget !== null && e.target.nodeName === "DIV" && e.relatedTarget.className.includes("resize") && dragResize !== "") {
      let [dir, order_num] = dragResize.split(',');
      let sameDir = e.relatedTarget.className.includes(dir);
      if (!sameDir) {
        let seatString = `${rowLetter}${seatNumber}`;
        let previewCopy = {
          ...previewAssignments
        };
        if (e.target.dataset.order_id === order_num) {
          previewCopy[seatString] = "";
        } else {
          delete previewCopy[seatString];
        }
        setPreviewAssignments(previewCopy);
      }
    }
  }
  function handleDragEnd(e) {
    if (dragResize !== "") {
      let [dir, order_num] = dragResize.split(',');
      // reportNewAssignmentRow(Object.keys(previewAssignments), order_num)
      reportNewAssignmentRow(Object.keys(previewAssignments), Object.values(previewAssignments));
    }
    setPreviewAssignments({});
    setDragResize("");
  }
  let joins = "";
  if (exists) {
    let name, note;
    if (order_id !== undefined) {
      let order_defined = orders[order_id] !== undefined;
      name = order_defined ? orders[order_id].name : /*#__PURE__*/React.createElement("div", {
        className: "loader"
      });
      note = order_defined ? orders[order_id].note : "";
    } else {
      name = "";
      note = "";
    }
    let previewName = undefined;
    if (previewAssignments[`${rowLetter}${seatNumber}`] === "") {
      previewName = "";
    } else if (previewAssignments[`${rowLetter}${seatNumber}`] !== undefined) {
      previewName = orders[previewAssignments[`${rowLetter}${seatNumber}`]].name;
    }
    name = previewName !== undefined ? previewName : name;
    let style = {};
    if (colours[colourMap[parseInt(order_id, 10)]] !== undefined) {
      let hue = colours[colourMap[parseInt(order_id, 10)]];
      style = {
        backgroundColor: `hsl(${hue}deg 100% 65% / 40%)`
      };
    }
    if (parseInt(assignments[`${rowLetter}${parseInt(seatNumber, 10) - 1}`], 10) === parseInt(order_id, 10)) {
      joins = joins + " join-left";
      if (colours[colourMap[parseInt(order_id, 10)]] !== undefined) {
        let hue = colours[colourMap[parseInt(order_id, 10)]];
        style.boxShadow = `hsl(${hue}deg 100% 65% / 40%) calc(-.5rem + -3px) 0`;
      }
    }
    if (parseInt(assignments[`${rowLetter}${parseInt(seatNumber, 10) + 1}`], 10) === parseInt(order_id, 10)) {
      joins = joins + " join-right";
    }
    return /*#__PURE__*/React.createElement("div", {
      draggable: order_id !== undefined,
      onDragStart: e => handleDragStart(e),
      className: order_id !== undefined ? `seat assigned ${joins}` : "seat",
      onDrop: e => handleDrop(e),
      onDragOver: e => handleDragOver(e),
      onDragEnter: e => handleDragEnter(e),
      onDragLeave: e => handleDragLeave(e),
      onDragEnd: e => handleDragEnd(e),
      "data-order_id": order_id
    }, /*#__PURE__*/React.createElement("span", {
      className: "resize left",
      "data-direction": "left",
      draggable: order_id !== undefined,
      onDragStart: e => handleDragStart(e)
    }), /*#__PURE__*/React.createElement("span", {
      className: "seatNum",
      style: style
    }, rowLetter, seatNumber), /*#__PURE__*/React.createElement("span", {
      className: "name"
    }, name), /*#__PURE__*/React.createElement("span", {
      className: "note",
      title: note
    }, note !== "" ? "i" : ""), /*#__PURE__*/React.createElement("span", {
      className: "remove",
      onClick: e => handleRemove(e)
    }, "\xD7"), /*#__PURE__*/React.createElement("span", {
      className: "resize right",
      "data-direction": "right",
      draggable: order_id !== undefined
    }));
  } else {
    return /*#__PURE__*/React.createElement("div", {
      className: `seat nonexistent ${seatNumber}`
    });
  }
}
function Ticket({
  groupName,
  showName,
  authors,
  showDate,
  name,
  seats
}) {
  let shortSeats = [];
  let temp = "";
  let ordering = name.toLowerCase().split(" ").slice(-1)[0].charCodeAt(0) - 96;
  if (seats.length > 2) {
    for (let i = 0; i < seats.length; i++) {
      if (temp === "") {
        temp = seats[i];
      }
      let row = seats[i][0];
      let seat = int(seats[i].substring(1));
      let next_seat = `${row}${seat + 1}`;
      if (i < seats.length - 1) {
        if (next_seat !== seats[i + 1]) {
          if (temp !== seats[i]) {
            shortSeats.push(`${temp}-${seats[i]}`);
          } else {
            shortSeats.push(temp);
          }
          temp = "";
        }
      } else {
        if (temp !== seats[i]) {
          shortSeats.push(`${temp}-${seats[i]}`);
        } else {
          shortSeats.push(temp);
        }
      }
    }
  } else {
    shortSeats = seats;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "ticket"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo"
  }, /*#__PURE__*/React.createElement(Icon, {
    icon: "siteLogo"
  })), /*#__PURE__*/React.createElement("div", {
    className: "group-presents"
  }, groupName, " presents"), /*#__PURE__*/React.createElement("div", {
    className: "show big"
  }, /*#__PURE__*/React.createElement("h1", null, showName)), /*#__PURE__*/React.createElement("div", {
    className: "authors"
  }, "by ", authors), /*#__PURE__*/React.createElement("div", {
    className: "date"
  }, /*#__PURE__*/React.createElement("h3", null, showDate)), /*#__PURE__*/React.createElement("div", {
    className: "name big"
  }, "Name: ", /*#__PURE__*/React.createElement("span", {
    className: "bold"
  }, name)), /*#__PURE__*/React.createElement("div", {
    className: "seats big"
  }, "Seats (", seats.length, "): ", /*#__PURE__*/React.createElement("span", {
    className: "bold"
  }, shortSeats.join(" "))), /*#__PURE__*/React.createElement("div", {
    className: "progs big"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bold"
  }, Math.max(1, Math.floor(seats.length / 2)))));
}

"use strict";

const sidebarItemsTest = [{
  type: "simple",
  title: "Tickets Available",
  icon: "ticket",
  link: "/tickets",
  linkText: "Purchase Tickets",
  target: "_blank"
}, {
  type: "socials",
  title: "Socials: ",
  socials: [{
    type: "social",
    linkText: "Newsletter Signup",
    class: "other",
    icon: "email_icon",
    link: "https://squareup.com/customer-programs/enroll/vWioYW6NwGxi/marketing"
  }, {
    type: "social",
    linkText: "Facebook",
    class: "facebook",
    icon: "fb_icon",
    link: "https://www.facebook.com/silchplayers/"
  }, {
    type: "social",
    linkText: "Twitter",
    class: "twitter",
    icon: "tw_icon",
    link: "https://twitter.com/silchplayers"
  }, {
    type: "social",
    linkText: "Instagram",
    class: "instagram",
    icon: "ig_icon",
    link: "https://www.instagram.com/silchesterplayers"
  }]
}, {
  type: "simple",
  title: "Latest Blog: May 2023",
  icon: "blog_icon",
  link: "/testreact/blog",
  linkText: "Preparations, Preparations",
  target: "_self"
}];
function Sidebar({
  sidebarItems = sidebarItemsTest,
  extras = [],
  show = true
}) {
  let items = [];
  for (let i = 0; i < extras.length; i++) {
    items.push(/*#__PURE__*/React.createElement(SidebarItem, {
      key: `extras[${i}]`,
      raw: extras[i]
    }));
  }
  for (let i = 0; i < sidebarItems.length; i++) {
    if (sidebarItems[i].type === "raw") {
      items.push(/*#__PURE__*/React.createElement(SidebarItem, {
        key: i,
        raw: sidebarItems[i].raw
      }));
    } else {
      items.push(/*#__PURE__*/React.createElement(SidebarItem, {
        key: i,
        item: sidebarItems[i]
      }));
    }
  }
  if (show) {
    return /*#__PURE__*/React.createElement("div", {
      className: "sidebar m"
    }, items);
  } else {
    return /*#__PURE__*/React.createElement(React.Fragment, null);
  }
}
function SidebarItem({
  item = {
    type: "raw"
  },
  raw = /*#__PURE__*/React.createElement("div", null)
}) {
  if (item.type === "simple") {
    return /*#__PURE__*/React.createElement("div", {
      className: "generic_link"
    }, /*#__PURE__*/React.createElement("h2", null, item.title), /*#__PURE__*/React.createElement(Link, {
      className: "generic_link",
      href: item.link,
      target: item.target
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon"
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: item.icon
    })), /*#__PURE__*/React.createElement("span", {
      className: "text"
    }, item.linkText)));
  }
  if (item.type === "simple_photos") {
    return /*#__PURE__*/React.createElement("div", {
      className: "generic_link"
    }, /*#__PURE__*/React.createElement("h2", null, item.title), /*#__PURE__*/React.createElement(Link, {
      className: "generic_link",
      href: item.link,
      target: item.target
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon"
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: item.icon
    })), /*#__PURE__*/React.createElement("span", {
      className: "text"
    }, item.linkText)));
  }
  if (item.type === "socials") {
    let socials = [];
    for (let i = 0; i < item.socials.length; i++) {
      socials.push(/*#__PURE__*/React.createElement(SidebarItem, {
        key: i,
        item: item.socials[i]
      }));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "socials"
    }, /*#__PURE__*/React.createElement("h2", null, item.title), socials);
  }
  if (item.type === "social") {
    let link;
    if (RegExp("^https://|^http://").test(item.link)) {
      link = item.link;
    } else {
      link = `https://${item.link}`;
    }
    return /*#__PURE__*/React.createElement(Link, {
      href: link,
      className: item.class,
      target: "_blank"
    }, /*#__PURE__*/React.createElement("span", {
      className: "icon"
    }, /*#__PURE__*/React.createElement(Icon, {
      icon: item.icon
    })), /*#__PURE__*/React.createElement("span", {
      className: "text"
    }, item.linkText));
  }
  if (item.type === "cart") {
    return /*#__PURE__*/React.createElement(SidebarCart, null);
  }
  if (item.type === "raw") {
    return /*#__PURE__*/React.createElement("div", {
      className: ""
    }, raw);
  }
}

"use strict";

function SquareCard({
  cardFor = "membership",
  formRef
}) {
  const context = React.useContext(app);
  const cardContainerRef = React.createRef(null);
  const [statusStyle, setStatusStyle] = React.useState({});
  const [statusClassName, setStatusClassName] = React.useState("");
  const verfTokenRef = React.useRef(0);
  const cardNonceRef = React.useRef(0);
  const cardJsonRef = React.useRef(0);
  const [verfToken, setVerfToken] = React.useState("");
  const [cardNonce, setCardNonce] = React.useState("");
  const [cardJson, setCardJson] = React.useState("");
  const pendingRef = React.createRef(null);
  const [card, setCard] = React.useState(undefined);
  if (!window.Square) {
    throw new Error('Square.js failed to load properly');
  }
  let appId = context.siteJson.square.appId;
  let locationId;
  if (cardFor === "membership") {
    locationId = context.siteJson.square.membershipLocationId;
  }
  const payments = window.Square.payments(appId, locationId);
  React.useEffect(() => {
    payments.card().then(c => {
      c.attach(cardContainerRef.current);
      setCard(c);
    });
  }, []);
  function handleCardStoreSubmit(onSuccess) {
    console.log("CARD STORE");
    card.tokenize().then(tokenResult => {
      if (tokenResult.status === 'OK') {
        console.log("TOKEN OK");
        console.log(tokenResult);
        let verificationDetails = {
          billingContact: {
            postalcode: tokenResult.details.billing.postalcode,
            countryCode: 'GB'
          },
          intent: 'STORE'
        };
        payments.verifyBuyer(tokenResult.token, verificationDetails).then(verificationResult => {
          console.log(verificationResult);
          console.log(verificationResult.token);
          displayPaymentResults('SUCCESS');
          let cardDetails = {
            "card_brand": tokenResult.details.card.brand,
            "exp_month": tokenResult.details.card.expMonth,
            "exp_year": tokenResult.details.card.expYear,
            "last_4": tokenResult.details.card.last4,
            "billing_address": {
              "postal_code": tokenResult.details.billing.postalCode
            }
          };
          cardJsonRef.current.value = JSON.stringify(cardDetails);
          cardNonceRef.current.value = tokenResult.token;
          verfTokenRef.current.value = verificationResult.token;
          // ReactDOM.flushSync(() => {
          // 	setCardNonce(tokenResult.token)
          // 	setVerfToken(verificationResult.token)
          // 	setCardJson(JSON.stringify(tokenResult.details.card))
          // })
        }).then(() => {
          console.log("ONSUCCESS");
          onSuccess();
        }).catch(error => {
          console.error(error.message);
          let error_code;
          try {
            let body = JSON.parse(e.message);
            error_code = body.errors[0].code;
          } catch (e) {
            error_code = "";
          }
          displayPaymentResults('FAILURE', error_code);
        });
      } else {
        console.log("TOKEN FAIL");
        let errorMessage = `Tokenization failed-status: ${tokenResult.status}`;
        if (tokenResult.errors) {
          errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
        }
        throw new Error(errorMessage);
      }
    });
  }
  function displayPaymentResults(status, code) {
    console.log("Payment Results: " + status);
    let newClassList = [];
    if (status === 'SUCCESS') {
      newClassList.push('is-success');
    } else {
      console.log("Error: " + code);
      newClassList.push('is-failure');
      if (code) {
        newClassList.push(code);
      }
    }
    setStatusClassName(newClassList.join(" "));
    setStatusStyle({
      visibility: 'visible'
    });
  }
  function handlePaymentButtonClick(event) {
    function onSuccess() {
      console.log("ON SUCCESS INNER");
      pendingRef.current.classList.remove("pending");
      console.log("ON SUCCESS INNER2");
      formRef.current.requestSubmit();
    }
    pendingRef.current.classList.add("pending");
    if (cardFor === "membership") {
      handleCardStoreSubmit(onSuccess);
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: pendingRef,
    className: `sub_form`
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("div", {
    id: "google-pay-button"
  }), /*#__PURE__*/React.createElement("div", {
    ref: cardContainerRef,
    id: "card-container"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "button",
    className: "card_pay_button",
    id: "card-button",
    onClick: e => {
      handlePaymentButtonClick(e);
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Pay with card")), /*#__PURE__*/React.createElement("div", {
    id: "payment-status-container",
    style: statusStyle,
    className: statusClassName
  }), /*#__PURE__*/React.createElement(Input, {
    type: "hidden",
    inputRef: verfTokenRef,
    id: "verfToken"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "hidden",
    inputRef: cardNonceRef,
    id: "cardNonce"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "hidden",
    inputRef: cardJsonRef,
    id: "cardJson"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }));
}

"use strict";

function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SidebarCart({}) {
  const context = React.useContext(app);
  const [tickets, setTickets] = React.useState({});
  const [localCart, setLocalCart] = React.useState({});
  React.useEffect(() => {
    fetch("/tickets/stock", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      setTickets(data.performances);
    });
  }, []);
  React.useEffect(() => {
    setLocalCart(context.ticketsCart);
  }, [context.ticketsCart]);
  let ticketsIDs = Object.keys(tickets).sort((a, b) => tickets[a].date > tickets[b].date ? 1 : -1);
  let pricing = {
    Adult: 1200,
    Child: 1000
  };
  let cartItems = [];
  let total = 0;
  let tempCart = Object.values(context.ticketsCart);
  if (ticketsIDs.length) {
    for (let i = 0; i < tempCart.length; i++) {
      let item = tempCart[i];
      if (item.type === "tickets") {
        let tempTickets = [];
        let count = 0;
        for (const [key, value] of Object.entries(item.tickets)) {
          let type = key;
          if (value > 1 && key === "Child") {
            type = "Children";
          } else if (value > 1) {
            type = `${key}s`;
          }
          if (value) {
            tempTickets.push(/*#__PURE__*/React.createElement("span", null, type, ": ", value));
          }
          total += pricing[key] * value;
          count += int(value);
        }
        if (count) {
          cartItems.push(/*#__PURE__*/React.createElement("div", {
            key: `cartItem${i}`,
            className: "cartItem",
            style: {
              '--i': ticketsIDs.indexOf(item.id),
              '--count': ticketsIDs.length
            }
          }, /*#__PURE__*/React.createElement(TicketImage, {
            image: tickets[item.id].image,
            date: tickets[item.id].date,
            hue: ticketsIDs.indexOf(item.id) * 360 / (ticketsIDs.length + 1),
            count: count
          }), /*#__PURE__*/React.createElement(React.Fragment, null), /*#__PURE__*/React.createElement("h3", {
            className: "title"
          }, tickets[item.id].title), /*#__PURE__*/React.createElement("h3", {
            className: "date"
          }, datetimeFormatter(tickets[item.id].date)), /*#__PURE__*/React.createElement("h4", {
            className: "tickets"
          }, tempTickets)));
        }
      }
    }
  }
  if (cartItems.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "sidebarCart"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "title"
    }, "Shopping Cart"), /*#__PURE__*/React.createElement("div", {
      className: "cart"
    }, cartItems), /*#__PURE__*/React.createElement(Link, {
      href: "/tickets/checkout"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "checkout button"
    }, "Checkout")), /*#__PURE__*/React.createElement("h3", {
      className: "total button"
    }, "Total: \xA3", (total / 100).toFixed(2)));
  } else {
    return /*#__PURE__*/React.createElement(React.Fragment, null);
  }
}
function datetimeFormatter(date) {
  const datetime = new Date(date);
  const day = ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"][datetime.getDay()];
  const ord = n => n > 3 && n < 21 ? "th" : n % 10 == 1 ? "st" : n % 10 == 2 ? "nd" : n % 10 == 3 ? "rd" : "th";
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][datetime.getMonth()];
  const ampm = datetime.getHours() >= 12 ? "pm" : "am";
  return `${day} ${datetime.getDate()}${ord(datetime.getDate())} ${month} - ${datetime.getHours() % 12}:${datetime.getMinutes()}${ampm}`;
}
function TicketItem({
  id,
  title,
  pricing,
  image,
  date,
  i,
  count,
  setActive,
  isActive = false,
  tickets
}) {
  const [classString, setClassString] = React.useState("");
  const context = React.useContext(app);
  const selfRef = React.useRef(null);
  let layout = tickets[id].layout;
  const maxSeats = layout.fullWidth * layout.rowCount - layout.hiddenSeats.length - Object.keys(tickets[id].seat_assignments).length - layout.newSeats;
  const [quantities, setQuantities] = React.useState({
    Adult: 0,
    Child: 0
  });

  // Calculate how many seats are already in the cart for this performance
  function seatsInCart() {
    const cartEntry = context.ticketsCart[id];
    if (!cartEntry) return 0;
    return Object.values(cartEntry.tickets).reduce((acc, cur) => acc + int(cur), 0);
  }

  // Remaining seats available (max minus what's already in cart)
  function remainingSeats() {
    return maxSeats - seatsInCart();
  }
  function addToCart() {
    const formCount = Object.values(quantities).reduce((acc, cur) => acc + int(cur), 0);
    if (formCount === 0) return;
    if (formCount > remainingSeats()) return;
    setClassString("progress");
    setTimeout(() => {
      setClassString("progress added");
      let tempCart = {
        ...context.ticketsCart
      };
      if (Object.keys(tempCart).includes(id)) {
        for (const [key, value] of Object.entries(quantities)) {
          tempCart[id].tickets[key] = int(value) + int(tempCart[id].tickets[key]);
        }
      } else {
        tempCart[id] = {
          id: id,
          type: "tickets",
          tickets: {
            ...quantities
          }
        };
      }
      context.functions.setTicketsCart(tempCart);
      for (const key of Object.keys(quantities)) {
        quantities[key] = 0;
      }
    }, 1000);
    setTimeout(() => {
      reset();
    }, 3000);
  }
  function reset() {
    setClassString("");
  }
  function quanChange(type, value) {
    const newValue = int(value);
    const otherTotal = Object.entries(quantities).filter(([key]) => key !== type).reduce((acc, [, val]) => acc + int(val), 0);
    const clampedValue = Math.max(0, Math.min(newValue, remainingSeats() - otherTotal));
    setQuantities({
      ...quantities,
      [type]: clampedValue
    });
  }
  function TicketQuantity({
    type
  }) {
    function change(change) {
      const newValue = int(quantities[type]) + change;
      const otherTotal = Object.entries(quantities).filter(([key]) => key !== type).reduce((acc, [, val]) => acc + int(val), 0);
      const clampedValue = Math.max(0, Math.min(newValue, remainingSeats() - otherTotal));
      quanChange(type, clampedValue);
    }
    return /*#__PURE__*/React.createElement("div", {
      key: type,
      className: `quantityForm ${type}`
    }, /*#__PURE__*/React.createElement("label", {
      htmlFor: type
    }, /*#__PURE__*/React.createElement("div", {
      className: "type"
    }, type, ": "), /*#__PURE__*/React.createElement("div", {
      className: "price"
    }, "\xA3", (pricing[type] / 100).toFixed(2))), /*#__PURE__*/React.createElement(Input, {
      id: type,
      type: "number",
      defaultValue: quantities[type],
      value: quantities[type],
      onChange: e => quanChange(type, e.target.value),
      stateful: true
    }), /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement(Icon, {
      onClick: () => {
        change(+1);
      }
    }, "stat_1"), /*#__PURE__*/React.createElement(Icon, {
      onClick: () => {
        change(-1);
      }
    }, "stat_minus_1")));
  }
  let formCount = Object.values(quantities).reduce((acc, cur) => acc + cur, 0);
  function makeActive() {
    if (!isActive) {
      setActive(id);
    }
  }
  function makeInActive() {
    setActive("");
  }
  if (selfRef.current && isActive) {
    selfRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: selfRef,
    className: `ticketItem ${isActive ? "active" : ""}`,
    style: {
      '--i': i,
      '--count': count
    },
    onClick: makeActive
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title
  }), /*#__PURE__*/React.createElement("div", {
    className: "image_cover"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lowerThirdBG"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lowerThirdContent"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    preserveAspectRatio: "xMidYMid slice"
  }, /*#__PURE__*/React.createElement("text", {
    x: "2.5%",
    y: "50.5%",
    fontSize: "60%",
    lengthAdjust: "spacingAndGlyphs",
    textLength: "95%",
    fontWeight: "bold",
    dominantBaseline: "middle"
  }, datetimeFormatter(date))))), /*#__PURE__*/React.createElement("h2", {
    className: "title"
  }, title, isActive ? ` - ${datetimeFormatter(date)}` : ""), /*#__PURE__*/React.createElement("h3", {
    className: "date"
  }, datetimeFormatter(date)), /*#__PURE__*/React.createElement("p", {
    className: "price"
  }, "Adult: \xA312, Child: \xA310"), /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "desc"
  }, "Doors open 30 minutes before the show starts. ", /*#__PURE__*/React.createElement("br", null), "Tickets can be collected at the venue. ", /*#__PURE__*/React.createElement("br", null), "Leave any seating requests in the notes box at checkout."), /*#__PURE__*/React.createElement("div", {
    className: "quantities"
  }, Object.keys(quantities).map(type => TicketQuantity({
    type
  }))), /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement("div", {
    className: `button addToCart ${classString} ${formCount === 0 || formCount > remainingSeats() ? "disabled" : ""}`,
    onClick: addToCart
  }, /*#__PURE__*/React.createElement("h3", {
    className: "callToAction"
  }, remainingSeats() ? `Add to Cart${formCount ? ` - ${formCount}` : ""}` : "No Seats Available"), /*#__PURE__*/React.createElement(Icon, {
    className: "progressWheel"
  }, "progress_activity"), /*#__PURE__*/React.createElement("div", {
    className: "successState"
  }, /*#__PURE__*/React.createElement(Icon, {
    className: "check"
  }, "check"))), /*#__PURE__*/React.createElement("div", {
    className: "button close",
    onClick: makeInActive
  }, /*#__PURE__*/React.createElement(Icon, null, "close")))));
}
function TicketStore({
  ticketsActive
}) {
  const context = React.useContext(app);
  // ticketsActive = context.siteJson.tickets_active === "1"
  ticketsActive = true;
  const [tickets, setTickets] = React.useState({});
  const [activeTicket, setActiveTicket] = React.useState("");
  React.useEffect(() => {
    fetch("/tickets/stock", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      setTickets(data.performances);
    });
  }, []);
  let ticketsIDs = Object.keys(tickets).sort((a, b) => tickets[a].date > tickets[b].date ? 1 : -1);
  return /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "store"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "titleText"
  }, "Store"), countTickets(context.ticketsCart) ? /*#__PURE__*/React.createElement("h2", {
    className: "cart"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/tickets/checkout"
  }, /*#__PURE__*/React.createElement("span", null, "Cart"), /*#__PURE__*/React.createElement(Icon, null, "shopping_cart"))) : /*#__PURE__*/React.createElement(React.Fragment, null)), ticketsActive ? /*#__PURE__*/React.createElement("div", {
    className: "tickets"
  }, ticketsIDs.map((ticket, i) => {
    return /*#__PURE__*/React.createElement(TicketItem, _extends({
      key: i,
      i: i,
      count: ticketsIDs.length,
      isActive: ticket === activeTicket,
      setActive: setActiveTicket
    }, tickets[ticket], {
      tickets: tickets
    }));
  })) : /*#__PURE__*/React.createElement(React.Fragment, null)));
}
function TicketImage({
  image,
  perfID,
  date,
  hue,
  count = 0
}) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    if (canvasRef.current) {
      let img = document.createElement("img");
      img.src = image;
      img.onload = () => {
        // console.log(img)
        let ctx = canvasRef.current.getContext("2d");
        ctx.drawImage(img, 0, 0, 700, 700);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 600, 700, 700);
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 50%)`;
        ctx.fillRect(0, 600, 700, 700);
        ctx.fillStyle = "white";
        ctx.font = "bold 68px Roboto";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(datetimeFormatter(date), 350, 658, 680);
        if (count > 0) {
          ctx.fillStyle = `black`;
          ctx.beginPath();
          ctx.arc(75, 75, 50, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = `hsla(${hue}, 100%, 70.2%, 50%)`;
          ctx.beginPath();
          ctx.arc(75, 75, 50, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.font = "bold 80px Roboto";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(count, 75, 82.5);

          // 813735 82100a
        }
      };
    }
  }, [canvasRef]);
  return /*#__PURE__*/React.createElement("div", {
    className: "ticketImage"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    perfID: perfID,
    width: "700",
    height: "700"
  }));
}
function countTickets(cart) {
  let count = 0;
  for (const ticket of Object.values(cart)) {
    for (const [type, quantity] of Object.entries(ticket.tickets)) {
      if (type !== "Programmes") {
        count += quantity;
      }
    }
  }
  return count;
}
function Checkout({
  ticketsCart
}) {
  const context = React.useContext(app);
  const [tickets, setTickets] = React.useState({});
  const [localCart, setLocalCart] = React.useState({});
  let ticketsIDs = Object.keys(tickets).sort((a, b) => tickets[a].date > tickets[b].date ? 1 : -1);
  let images = {};
  React.useEffect(() => {
    fetch("/tickets/stock", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      setTickets(data.performances);
    });
  }, []);
  function increment(e, perfID, type, amount) {
    e.preventDefault();
    let tempCart = {
      ...localCart
    };
    let layout = tickets[perfID].layout;
    let maxSeats = layout.fullWidth * layout.rowCount - layout.hiddenSeats.length - Object.keys(tickets[perfID].seat_assignments).length - layout.newSeats;
    if (tempCart[perfID].tickets[type] < maxSeats) {
      tempCart[perfID].tickets[type] += amount;
    } else {
      alert("No more seats available for this show");
    }
    context.functions.setTicketsCart(tempCart);
  }
  function remove(e, perfID, type) {
    e.preventDefault();
    let tempCart = {
      ...localCart
    };
    if (tempCart[perfID].tickets[type] > 0) {
      tempCart[perfID].tickets[type] = 0;
    }
    context.functions.setTicketsCart(tempCart);
  }
  React.useEffect(() => {
    setLocalCart(context.ticketsCart);
  }, [context.ticketsCart]);
  let total = 0;
  let totalQuantity = 0;
  let checkoutCart = [];
  if (Object.keys(tickets).length !== 0) {
    for (const ticket of Object.keys(localCart)) {
      let performance = tickets[localCart[ticket].id];
      let date = new Date(performance.date);
      let subtotal = 0;
      for (const [type, quantity] of Object.entries(localCart[ticket].tickets)) {
        subtotal = quantity * performance.pricing[type];
        total += subtotal;
        totalQuantity += quantity;
        if (quantity > 0) {
          checkoutCart.push(/*#__PURE__*/React.createElement("div", {
            className: "checkoutRow"
          }, /*#__PURE__*/React.createElement(TicketImage, {
            image: performance.image,
            perfID: performance.id,
            date: performance.date,
            hue: ticketsIDs.indexOf(performance.id) / ticketsIDs.length
          }), /*#__PURE__*/React.createElement("div", {
            className: "checkoutRowText"
          }, /*#__PURE__*/React.createElement("span", {
            className: "title"
          }, performance.title), /*#__PURE__*/React.createElement("span", null, datetimeFormatter(date)), /*#__PURE__*/React.createElement("span", null, type)), /*#__PURE__*/React.createElement("div", {
            className: "quantity"
          }, "x", quantity), /*#__PURE__*/React.createElement("div", {
            className: "subtotal"
          }, "\xA3", (subtotal / 100).toFixed(2)), /*#__PURE__*/React.createElement("div", {
            className: "edit"
          }, /*#__PURE__*/React.createElement("a", {
            href: "",
            onClick: e => {
              increment(e, performance.id, type, 1);
            }
          }, "+1"), /*#__PURE__*/React.createElement("a", {
            href: "",
            onClick: e => {
              increment(e, performance.id, type, -1);
            }
          }, "-1"), /*#__PURE__*/React.createElement("a", {
            href: "",
            onClick: e => {
              remove(e, performance.id, type);
            }
          }, "Remove All"))));
        }
      }
    }
  }
  if (checkoutCart.length === 0 && countTickets(context.ticketsCart) === 0) {
    context.functions.setPath("/tickets");
  }
  if (Object.keys(tickets).length !== 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "checkout"
    }, /*#__PURE__*/React.createElement("h1", null, "Checkout"), /*#__PURE__*/React.createElement("div", {
      id: "checkoutCart",
      className: "cart"
    }, checkoutCart, /*#__PURE__*/React.createElement("div", {
      className: "checkoutRow total"
    }, /*#__PURE__*/React.createElement("div", {
      className: "checkoutRowText total"
    }, "Total:"), /*#__PURE__*/React.createElement("div", {
      className: "quantity total"
    }, "x", totalQuantity), /*#__PURE__*/React.createElement("div", {
      className: "subtotal"
    }, "\xA3", (total / 100).toFixed(2)))), /*#__PURE__*/React.createElement(StorePayment, {
      amount: total,
      cart: localCart
    })));
  } else {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading"
    });
  }
}
function StorePayment({
  amount = 0,
  cart
}) {
  const context = React.useContext(app);
  const appId = context.siteJson.square.appId;
  const locationId = context.siteJson.square.webstoreLocationId;
  const payments = window.Square.payments(appId, locationId);
  const cardContainerRef = React.createRef(null);
  const [statusStyle, setStatusStyle] = React.useState({});
  const [statusClassName, setStatusClassName] = React.useState("");
  const [card, setCard] = React.useState(undefined);
  const pendingRef = React.createRef(null);
  const statusContainer = React.createRef(null);
  const verfTokenRef = React.useRef(null);
  const cardNonceRef = React.useRef(null);
  const cardJsonRef = React.useRef(null);
  const [msg, setMsg] = React.useState("");
  React.useEffect(() => {
    payments.card().then(c => {
      c.attach(cardContainerRef.current);
      setCard(c);
    });
  }, []);
  //
  // if (document.querySelector("#checkoutCart")) {
  // 	document.querySelector("#checkoutCart").querySelectorAll("canvas").forEach((canvas) => {
  // 		console.log(canvas.getAttribute("perfID"))
  // 	})
  // }

  function handlePaymentButtonClick(e) {
    function onSuccess() {
      console.log("ON SUCCESS INNER");
      pendingRef.current.classList.remove("pending");
      console.log("ON SUCCESS INNER2");
      pendingRef.current.requestSubmit();
    }
    function onError() {
      pendingRef.current.classList.remove("pending");
    }
    pendingRef.current.classList.add("pending");
    try {
      card.tokenize().then(result => {
        if (result.status === 'OK') {
          console.log(`Payment token is ${result.token}`);
          let cardDetails = {
            "card_brand": result.details.card.brand,
            "exp_month": result.details.card.expMonth,
            "exp_year": result.details.card.expYear,
            "last_4": result.details.card.last4,
            "billing_address": {
              "postal_code": result.details.billing.postalCode
            }
          };
          payments.verifyBuyer(result.token, {
            amount: (amount / 100).toFixed(2),
            currencyCode: 'GBP',
            billingContact: {
              postalCode: result.details.billing.postalCode,
              countryCode: 'GB'
            },
            intent: 'CHARGE'
          }).then(verificationResult => {
            cardJsonRef.current.value = JSON.stringify(cardDetails);
            cardNonceRef.current.value = result.token;
            verfTokenRef.current.value = verificationResult.token;

            // statusContainer.current.innerHTML = "Payment Successful";
            setStatusStyle({
              visibility: "visible"
            });
            onSuccess();
          }).catch(error => {
            console.error(error.message);
            let error_code;
            try {
              let body = JSON.parse(e.message);
              error_code = body.errors[0].code;
            } catch (e) {
              error_code = "";
            }
            displayPaymentResults('FAILURE', error_code);
            onError();
          });
        } else {
          let errorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            errorMessage += ` and errors: ${JSON.stringify(result.errors)}`;
          }
          onError();
          throw new Error(errorMessage);
        }
      });
    } catch (e) {
      console.error(e);
      statusContainer.current.innerHTML = "Payment Failed";
      onError();
    }
  }
  function displayPaymentResults(status, code) {
    console.log("Payment Results: " + status);
    let newClassList = [];
    if (status === 'SUCCESS') {
      newClassList.push('is-success');
    } else {
      console.log("Error: " + code);
      newClassList.push('is-failure');
      if (code) {
        newClassList.push(code);
      }
    }
    setStatusClassName(newClassList.join(" "));
    setStatusStyle({
      visibility: 'visible'
    });
    // statusContainer.current.innerHTML = code
  }
  function handlePaymentSubmit(e) {
    e.preventDefault();
    setMsg("");
    // if (document.querySelector("#checkoutCart")) {
    // 	document.querySelector("#checkoutCart").querySelectorAll("canvas").forEach((canvas) => {
    // 		console.log(canvas.perfID)
    // 	})
    // }

    let formData = new FormData(e.target);
    fetch(e.target.action, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        items: cart,
        form: formToJson(formData)
      })
    }).then(resp => {
      return resp.json();
    }).then(data => {
      if (data.status === "success") {
        displayPaymentResults('SUCCESS', data.msg);
        context.functions.setPath(`/tickets/checkout/success?id=${data.receipt_id}&host=${data.receipt_host}`);
      } else {
        displayPaymentResults('FAILURE', data.msg);
        setMsg(data.msg);
      }
    });
  }
  return /*#__PURE__*/React.createElement("form", {
    action: "/tickets/checkout/payment",
    onSubmit: handlePaymentSubmit,
    ref: pendingRef,
    className: `payment form`
  }, /*#__PURE__*/React.createElement("div", {
    className: "form"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "notes",
    type: "textarea",
    label: "Notes - Seating Requests etc"
  }), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement(Input, {
    id: "name",
    type: "text",
    label: "Name *",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    id: "phone",
    type: "text",
    label: "Phone Number *",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    id: "email",
    type: "text",
    label: "Email *",
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    ref: cardContainerRef,
    id: "card-container"
  }), /*#__PURE__*/React.createElement("div", {
    ref: statusContainer,
    id: "payment-status-container",
    style: statusStyle,
    className: statusClassName
  }), /*#__PURE__*/React.createElement("div", {
    className: "msg"
  }, msg), /*#__PURE__*/React.createElement(Input, {
    type: "button",
    className: "card_pay_button",
    id: "card-button",
    onClick: e => {
      handlePaymentButtonClick(e);
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Pay with card - \xA3", (amount / 100).toFixed(2))), /*#__PURE__*/React.createElement(Input, {
    type: "hidden",
    inputRef: verfTokenRef,
    id: "verf_token"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "hidden",
    inputRef: cardNonceRef,
    id: "payment_token"
  }), /*#__PURE__*/React.createElement(Input, {
    type: "hidden",
    inputRef: cardJsonRef,
    id: "card_json"
  })), /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }));
}
function CheckoutSuccess({}) {
  const [receiptId, setReceiptId] = React.useState("");
  const context = React.useContext(app);
  React.useEffect(() => {
    context.functions.setTicketsCart({});
    const urlParams = new URLSearchParams(window.location.search);
    const receipt = urlParams.get('id');
    if (receipt) {
      setReceiptId(receipt);
    }
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "content payment_success"
  }, /*#__PURE__*/React.createElement("h1", null, "Payment Successful"), /*#__PURE__*/React.createElement("p", null, "Thank you for your order. Your receipt should be sent to your email within 24 hours. We are experiencing some delays with our receipt processing, so if you do not receive your receipt, please contact us at ", /*#__PURE__*/React.createElement("a", {
    href: "mailto:boxoffice@silchesterplayers.org"
  }, "boxoffice@silchesterplayers.org"), "."), /*#__PURE__*/React.createElement("p", null, "Please collect your tickets at the door. Doors open 30 minutes before the show starts. No need to bring your receipt, just give your name at the desk."));
}

"use strict";

function Tabs({
  redrawInt = 0,
  children
}) {
  const [currentTabTitle, setCurrentTabTitle] = React.useState(children[0].props.title);
  const [currentTabContent, setCurrentTabContent] = React.useState(children[0]);
  const [currentOtherTabsContent, setCurrentOtherTabsContent] = React.useState([]);
  const [tab_titles, setTabTitles] = React.useState([]);
  const [tabs, setTabs] = React.useState({});
  React.useEffect(() => {
    let temp_tab_titles = [];
    let temp_tabs = {};
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      if (child.props !== undefined && child.props.title !== undefined) {
        let classname = "tab_name";
        if (child.props.title === currentTabTitle) {
          classname = "tab_name active";
        }
        temp_tab_titles.push(/*#__PURE__*/React.createElement("div", {
          key: child.props.title,
          onClick: () => {
            handleTabClick(child.props.title);
          },
          className: classname
        }, /*#__PURE__*/React.createElement("h2", null, child.props.title)));
        temp_tabs[child.props.title] = child;
      }
    }
    setTabTitles(temp_tab_titles);
    setTabs(temp_tabs);
  }, [children, currentTabTitle, redrawInt]);
  function handleTabClick(newTitle) {
    setCurrentTabTitle(newTitle);
    setCurrentTabContent(tabs[newTitle]);
    let tempOtherTabs = [];
    for (let i = 0; i < tab_titles.length; i++) {
      let tab_title = tab_titles[i];
      if (tab_title !== newTitle) {
        tempOtherTabs.push(tabs[tab_title]);
      }
    }
    setCurrentOtherTabsContent(tempOtherTabs);
  }
  if (children.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "tabs_container",
      "data-redraw": redrawInt
    }, /*#__PURE__*/React.createElement("div", {
      className: "tab_titles"
    }, tab_titles), /*#__PURE__*/React.createElement("div", {
      className: "current_tab"
    }, currentTabContent), /*#__PURE__*/React.createElement("div", {
      className: "other_tabs"
    }, currentOtherTabsContent));
  }
}
function Tab({
  title,
  children,
  redrawInt = 0
}) {
  const [internalRedrawInt, setInternalRedrawInt] = React.useState(0);
  React.useEffect(() => {
    setInternalRedrawInt(internalRedrawInt + redrawInt + 1);
  }, [redrawInt, children]);
  return /*#__PURE__*/React.createElement("div", {
    className: "tab_content",
    "data-redraw": internalRedrawInt
  }, children);
}