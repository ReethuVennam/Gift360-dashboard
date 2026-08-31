package com.sabbpe.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class Gift360AdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(Gift360AdminApplication.class, args);
    }
}
