![Cardiff University Logo](https://tinyurl.com/CardiffUniLogo)
---
# Initial Plan
## Theatre Company Website and Backend

--- 

| CM3203 - One Semester Individual Project |
|:----------------------------------------:|
|               Credits: 40                |
|        School of Computer Science        |
|         Cardiff University, 2022         |

|       Author: Matthew Larby        |
|:----------------------------------:|
| **Supervisor: Dr Daniela Tsaneva** |

---

## Project Description
This project is centered around building custom website features for a client, 
more specifically an Amateur Dramatics group. The groups current website is 
deployed using WordPress which lacks proper implementation of a few features 
that they need. Currently, their website uses available features to create 
approximations of the desired behaviours but that makes it hard to maintain and 
update, especially as some pages have been broken by deprecated dependencies.

The main development aims of the project are:
- Custom Image Gallery for Google Photos images.
- Improved Show Archive page with full show details.
- Blog page and editor.
- Members only web-portal

My personal aims for the project are:
- Practise writing code for a production environment rather than prototypes.
- Improve writing documentation for a project.

## Project Aims and Objectives

- Custom Image Gallery
	- To replace the broken Picasa galleries on the current website
	- Load images from the clients Google Photos storage
- IMDb-style Show Archive
    - Consolidate data from individual web pages and old show programmes into a 
  database.
    - Store and display over 130 past shows spread across 47 years.
    - include cast & crew and ability to see which shows a person was in.
- Blog Page
	- Posts stored in database
	- intuitive editor (WYSIWYG)
	- ability to upload and convert Word documents
- Members only web-portal
	- Resource sharing
	- rehearsal/event scheduling
	- announcement collation


## Work Plan

### Supervisor Meetings
Weekly supervisor meetings have been arranged for every Wednesday morning.

### Weekly Goals
| Week     | Goals            | Details                                       |
|:---------|:-----------------|:----------------------------------------------|
| 1        | Initial plan     | Initial Plan Deliverable by 7/2/22            |
| 2        | Research + Setup |                                               |
| 3        | Continue Setup   | incl. server deploy for prod and dev versions |
| 4        | Build base pages | migrate existing code and static pages        |
| 5        | Show Archive     |                                               |
| 6        | Blog             | incl. WYSIWYG editor                          |
| 7 (R)    | Image Gallery    |                                               |
| 8        | Portal           | Events/Rehearsal Scheduling                   |
| 9        | Portal           | Resource Hosting/Sharing                      |
| Easter 1 | Finish up Portal |                                               |
| Easter 2 | Data entry       |                                               |
| Easter 3 | Data entry       |                                               |
| 10       | Final Report     |                                               |
| 11       | Final Report     |                                               |
| 12       | Final Report     | Final Report Deliverable by 13/5/22           |

### Research plan

- Explore examples of web portals to find improvements that can be made on 
existing products.
- Research database types to find the best fit for this use case.
- Ensure the chosen technologies will be able to cope with the clients current 
website traffic.

### Technologies
For the webapps backend, I will be using the Python-based Flask micro-framework 
along with various associated libraries for connecting to the database, 
handling web-sockets, and verifying forms. I've chosen Flask for my backend as: 
I have lots of experience using it;it is lightweight and modular compared to 
alternatives like Django; it has great performance and has been used by many 
high-traffic websites such as Reddit, Netflix, Trivago, Patreon, AirBnB and 
Uber (see [https://stackshare.io/flask](https://stackshare.io/flask)).

For the database, I will either use PostgreSQL or MongoDB. I've previously used 
PostgreSQL databases with flask projects however it's static schema nature tends
to slow development. On the other-hand, MongoDB has a dynamic schema which allows
for flexibility in development, but I've not previously integrated a NoSQL-type 
database into a flask project which could pose some initial difficulty. As part 
of my research phase, I will explore the different pros and cons of each 
database before decided which of the two is best suited to the specifics of my 
project.

For the front-end, I have only got experience in using HTML, CSS and vanilla JS 
however I would like to use this project as an opportunity to learn a javascript
framework and utilise that to improve the overall look and feel of the website. 
From my prior research, I've decided to learn and implement Vue.JS as it is 
recommended for beginners and is lightweight as to run faster on the users 
browsers.

For hosting the project, I will be using a Ubuntu VPS (virtual private server). 
I've chosen to host on Ubuntu as it has I have experience using debian-based 
operating systems and Ubuntu has much more up-to-date packages than Debian 
itself. On top of that, Ubuntu has a huge range of tutorials and a large 
community around it. 


### Ethics
As my project has a real-world client, I will have to get ethics approval for 
the client interviews and questionnaires. I will also have to make sure I 
securely store private data such as email addresses and passwords for the portal
login system.
Another ethical consideration for the project is including a privacy notice to 
describe what and how any personal data is being collected, used and stored. 
I will also have to make sure that any personal data is processed according 
to GDPR regulations and guidance from the Information Commissioner's Office
([ico.org.uk](ico.org.uk))