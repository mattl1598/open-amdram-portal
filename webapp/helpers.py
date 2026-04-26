from flask import Request


def request_to_json(req: Request):
	data = {
		"method": req.method,
		"path": req.path,
		"json": req.json,
		"form": req.form.to_dict(),
		"args": req.args.to_dict(),
		"content_type": req.content_type,
		"endpoint": req.endpoint,
		"origin": req.referrer,
	}

	return data
