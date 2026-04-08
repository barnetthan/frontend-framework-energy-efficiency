from selenium import webdriver

# This opens a Firefox window and goes to Google
driver = webdriver.Firefox()
driver.get("https://www.google.com")
print("Connection Successful!")
driver.quit()