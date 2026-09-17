from rembg import remove
from PIL import Image
input_path = '/Users/macbook/.gemini/antigravity/brain/5e1d44ae-c14b-4ef8-b1f3-5e88a883b4d2/worker_chainsaw_1789664319672.jpg'
output_path = '/Users/macbook/Downloads/epic_nature_landing/assets/images/hero_worker_cutout.png'
input_img = Image.open(input_path)
output_img = remove(input_img)
output_img.save(output_path)
