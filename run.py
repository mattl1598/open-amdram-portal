from webapp import create_app



if __name__ == '__main__':
	app = create_app()
	app.run(host="0.0.0.0", use_reloader=False)
	# app.run()
