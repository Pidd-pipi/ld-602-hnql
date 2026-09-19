package com.generated.rescueStock.config;

import com.generated.rescueStock.middlewares.AuditLogMiddleware;
import com.generated.rescueStock.middlewares.AuthMiddleware;
import com.generated.rescueStock.middlewares.RateLimitMiddleware;
import com.generated.rescueStock.middlewares.RbacMiddleware;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@MapperScan("com.generated.rescueStock.repositories")
public class AppConfig implements WebMvcConfigurer {
  private final AuthMiddleware authMiddleware;
  private final RbacMiddleware rbacMiddleware;
  private final RateLimitMiddleware rateLimitMiddleware;
  private final AuditLogMiddleware auditLogMiddleware;

  public AppConfig(AuthMiddleware authMiddleware, RbacMiddleware rbacMiddleware,
                   RateLimitMiddleware rateLimitMiddleware, AuditLogMiddleware auditLogMiddleware) {
    this.authMiddleware = authMiddleware;
    this.rbacMiddleware = rbacMiddleware;
    this.rateLimitMiddleware = rateLimitMiddleware;
    this.auditLogMiddleware = auditLogMiddleware;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(rateLimitMiddleware).addPathPatterns("/api/**");
    registry.addInterceptor(authMiddleware).addPathPatterns("/api/**");
    registry.addInterceptor(rbacMiddleware).addPathPatterns("/api/**");
    registry.addInterceptor(auditLogMiddleware).addPathPatterns("/api/**");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**").allowedMethods("*").allowedHeaders("*").allowedOrigins("*");
  }
}
