package com.sabbpe.admin.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

@Service
@Slf4j
public class AdminSpCaller {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public AdminSpCaller(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> callQuery(String spName, Map<String, Object> params) {
        try {
            StringBuilder sql = new StringBuilder("{call ").append(spName).append("(");
            if (params != null && !params.isEmpty()) {
                sql.append(String.join(",", Collections.nCopies(params.size(), "?")));
            }
            sql.append(")}");

            Connection conn = dataSource.getConnection();
            try {
                CallableStatement cs = conn.prepareCall(sql.toString());
                if (params != null) {
                    int i = 1;
                    for (Object value : params.values()) {
                        if (value == null) {
                            cs.setNull(i, Types.VARCHAR);
                        } else if (value instanceof Integer) {
                            cs.setInt(i, (Integer) value);
                        } else if (value instanceof Long) {
                            cs.setLong(i, (Long) value);
                        } else {
                            String s = value.toString();
                            if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
                                cs.setDate(i, java.sql.Date.valueOf(s));
                            } else {
                                cs.setString(i, s);
                            }
                        }
                        i++;
                    }
                }
                cs.execute();

                List<Map<String, Object>> allRows = new ArrayList<>();
                ResultSet rs = cs.getResultSet();
                while (rs != null) {
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int j = 1; j <= rs.getMetaData().getColumnCount(); j++) {
                            row.put(rs.getMetaData().getColumnLabel(j), rs.getObject(j));
                        }
                        allRows.add(row);
                    }
                    rs.close();
                    if (cs.getMoreResults()) {
                        rs = cs.getResultSet();
                    } else {
                        rs = null;
                    }
                }
                cs.close();
                return allRows;
            } finally {
                conn.close();
            }
        } catch (Exception e) {
            log.error("Error calling stored procedure {}: {}", spName, e.getMessage(), e);
            throw new RuntimeException("SP call failed: " + spName, e);
        }
    }

    public Map<String, Object> callSingle(String spName, Map<String, Object> params) {
        List<Map<String, Object>> rows = callQuery(spName, params);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    public List<Map<String, Object>> query(String sql, Object... params) {
        return jdbcTemplate.queryForList(sql, params);
    }

    public int update(String sql, Object... params) {
        return jdbcTemplate.update(sql, params);
    }
}
