package com.kossa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KossaApplication {

	public static void main(String[] args) {
		SpringApplication.run(KossaApplication.class, args);
	}
}
