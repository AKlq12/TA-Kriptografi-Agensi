<?php
namespace App\Services;

use Intervention\Image\ImageManagerStatic as Image;

class SteganografiService
{
    // Karakter penanda akhir pesan
    private $delimiter = "::END::";

    // Fungsi untuk mengubah teks menjadi biner
    private function textToBinary($text)
    {
        $bin = '';
        for ($i = 0; $i < strlen($text); $i++) {
            $bin .= str_pad(decbin(ord($text[$i])), 8, "0", STR_PAD_LEFT);
        }
        return $bin;
    }

    // Fungsi untuk mengubah biner menjadi teks
    private function binaryToText($bin)
    {
        $text = '';
        $bin_array = str_split($bin, 8);
        foreach ($bin_array as $byte) {
            if (strlen($byte) == 8) {
                $text .= chr(bindec($byte));
            }
        }
        return $text;
    }

    // Menu 2: Masukkan Teks ke Gambar (Encode)
    public function encode($image, $text)
    {
        // Paksa ke PNG agar lossless (tidak merusak data LSB)
        $img = Image::make($image->getRealPath())->encode('png'); 
        $textToEmbed = $text . $this->delimiter;
        $binaryText = $this->textToBinary($textToEmbed);
        $binaryLength = strlen($binaryText);
        $bitIndex = 0;

        $width = $img->width();
        $height = $img->height();

        // Cek apakah gambar cukup besar
        if ($binaryLength > ($width * $height * 3)) {
            throw new \Exception("Teks terlalu panjang untuk gambar ini.");
        }

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                if ($bitIndex >= $binaryLength) {
                    break 2; // Selesai embed
                }

                $color = $img->pickColor($x, $y, 'array'); // [R, G, B, A]
                
                // Ubah 3 bit (R, G, B)
                for ($i = 0; $i < 3; $i++) {
                    if ($bitIndex < $binaryLength) {
                        $bit = $binaryText[$bitIndex];
                        // Ubah LSB (bit terakhir)
                        $color[$i] = ($color[$i] & 254) | $bit; 
                        $bitIndex++;
                    }
                }
                
                // Set piksel baru
                $img->pixel([$color[0], $color[1], $color[2], $color[3]], $x, $y);
            }
        }
        return $img; // Kembalikan objek gambar
    }

    // Menu 2: Ekstrak Teks dari Gambar (Decode)
    public function decode($image)
    {
        $img = Image::make($image->getRealPath());
        $binaryText = '';
        $decodedText = '';

        $width = $img->width();
        $height = $img->height();

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                $color = $img->pickColor($x, $y, 'array');

                // Baca 3 LSB (R, G, B)
                for ($i = 0; $i < 3; $i++) {
                    $binaryText .= ($color[$i] & 1);
                }

                // Cek setiap 8 bit (1 karakter)
                if (strlen($binaryText) % 8 == 0) {
                    $decodedText = $this->binaryToText($binaryText);
                    
                    // Cek apakah delimiter ditemukan
                    $delimiterPos = strpos($decodedText, $this->delimiter);
                    if ($delimiterPos !== false) {
                        // Hentikan proses dan kembalikan teks
                        return substr($decodedText, 0, $delimiterPos);
                    }
                }
            }
        }
        return "Tidak ada pesan rahasia ditemukan.";
    }
}